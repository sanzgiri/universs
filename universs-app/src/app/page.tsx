'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';

interface HNData {
  score: number;
  comments: number;
  hnUrl: string;
}

interface FeedItem {
  title: string;
  link: string;
  pubDate: string;
  timestamp: number;
  source: string;
  sourceUrl: string;
  category: string;
  hn: HNData | null;
}

interface FeedResponse {
  items: FeedItem[];
  lastUpdated: string;
  settings: {
    postsPerFeed: number;
    maxFeeds: number;
    refreshIntervalMinutes: number;
    maxAgeDays: number;
  };
}

type SortOption = 'recent' | 'popular';
type Theme = 'dark' | 'light';

const categoryColors: Record<string, string> = {
  Tech: 'bg-blue-500/20 text-blue-500 dark:text-blue-400',
  Security: 'bg-red-500/20 text-red-500 dark:text-red-400',
  Apple: 'bg-gray-500/20 text-gray-500 dark:text-gray-400',
  AI: 'bg-purple-500/20 text-purple-500 dark:text-purple-400',
  Science: 'bg-green-500/20 text-green-600 dark:text-green-400',
  Culture: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
  Math: 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400',
  Hardware: 'bg-orange-500/20 text-orange-600 dark:text-orange-400',
  Gaming: 'bg-pink-500/20 text-pink-500 dark:text-pink-400',
  Design: 'bg-indigo-500/20 text-indigo-500 dark:text-indigo-400',
  Business: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
};

const STORAGE_KEYS = {
  theme: 'universs-theme',
  bookmarks: 'universs-bookmarks',
  read: 'universs-read',
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/**
 * A Set persisted to localStorage. Used for bookmarks and read-tracking.
 * Returns the current set plus toggle/add helpers. SSR-safe via a lazy
 * initializer that only touches localStorage in the browser.
 */
function readStoredSet(key: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function usePersistentSet(key: string) {
  const [set, setSet] = useState<Set<string>>(() => readStoredSet(key));

  const writeThrough = useCallback(
    (next: Set<string>) => {
      try {
        window.localStorage.setItem(key, JSON.stringify([...next]));
      } catch {
        /* storage full / unavailable — keep in-memory */
      }
      return next;
    },
    [key]
  );

  const toggle = useCallback(
    (id: string) => {
      setSet((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return writeThrough(next);
      });
    },
    [writeThrough]
  );

  const add = useCallback(
    (id: string) => {
      setSet((prev) => {
        if (prev.has(id)) return prev;
        const next = new Set(prev);
        next.add(id);
        return writeThrough(next);
      });
    },
    [writeThrough]
  );

  return { set, toggle, add };
}

function useTheme(): [Theme, () => void] {
  // Lazy-init from the attribute the inline layout script already applied,
  // so we never call setState in an effect (and avoid a hydration flash).
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof document === 'undefined') return 'dark';
    const current = document.documentElement.getAttribute('data-theme');
    return current === 'light' ? 'light' : 'dark';
  });

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try {
        window.localStorage.setItem(STORAGE_KEYS.theme, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return [theme, toggle];
}

export default function Home() {
  const [data, setData] = useState<FeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [sort, setSort] = useState<SortOption>('recent');
  const [query, setQuery] = useState('');
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [hideRead, setHideRead] = useState(false);

  const [theme, toggleTheme] = useTheme();
  const bookmarks = usePersistentSet(STORAGE_KEYS.bookmarks);
  const read = usePersistentSet(STORAGE_KEYS.read);

  const fetchFeeds = useCallback(async () => {
    try {
      const response = await fetch('/api/feeds');
      if (!response.ok) throw new Error('Failed to fetch feeds');
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeeds();
  }, [fetchFeeds]);

  // Refresh on the interval configured by the API (falls back to 60 min).
  useEffect(() => {
    const minutes = data?.settings?.refreshIntervalMinutes ?? 60;
    const interval = setInterval(fetchFeeds, minutes * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchFeeds, data?.settings?.refreshIntervalMinutes]);

  const categories = data
    ? ['all', ...Array.from(new Set(data.items.map((item) => item.category))).sort()]
    : ['all'];

  const filteredAndSortedItems = useMemo(() => {
    if (!data?.items) return [];

    const q = query.trim().toLowerCase();

    let items = data.items.filter((item) => {
      if (filter !== 'all' && item.category !== filter) return false;
      if (showSavedOnly && !bookmarks.set.has(item.link)) return false;
      if (hideRead && read.set.has(item.link)) return false;
      if (q) {
        const haystack = `${item.title} ${item.source} ${item.category}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    if (sort === 'popular') {
      // Sort by HN score (items with HN data first, then by score)
      items = [...items].sort((a, b) => {
        const scoreA = a.hn?.score ?? -1;
        const scoreB = b.hn?.score ?? -1;
        return scoreB - scoreA;
      });
    }
    // 'recent' is already sorted by API

    return items;
  }, [
    data?.items,
    filter,
    sort,
    query,
    showSavedOnly,
    hideRead,
    bookmarks.set,
    read.set,
  ]);

  const hnCount = data?.items.filter((item) => item.hn !== null).length ?? 0;
  const savedCount = bookmarks.set.size;

  const pillBase =
    'px-3 py-1.5 text-sm rounded-full transition-colors cursor-pointer';
  const pillActive = 'bg-[var(--invert-bg)] text-[var(--invert-fg)]';
  const pillInactive =
    'bg-[var(--card)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)]';

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">UNIVERSS</h1>
              <p className="text-[var(--muted)] text-sm mt-1">
                What&apos;s happening in tech right now?
              </p>
            </div>
            <button
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="shrink-0 p-2 rounded-full bg-[var(--card)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors cursor-pointer"
            >
              {theme === 'dark' ? (
                // Sun icon (click to go light)
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </svg>
              ) : (
                // Moon icon (click to go dark)
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          </div>

          {/* Search */}
          <div className="relative mt-4">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles and sources…"
              className="w-full rounded-full bg-[var(--card)] border border-[var(--border)] py-2 pl-9 pr-4 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Filters and Sort */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setFilter(category)}
                className={`${pillBase} ${filter === category ? pillActive : pillInactive}`}
              >
                {category === 'all' ? 'All' : category}
              </button>
            ))}
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <span className="text-[var(--muted)] text-sm">Sort:</span>
            <button
              onClick={() => setSort('recent')}
              className={`${pillBase} ${sort === 'recent' ? pillActive : pillInactive}`}
            >
              Recent
            </button>
            <button
              onClick={() => setSort('popular')}
              className={`${pillBase} ${
                sort === 'popular'
                  ? 'bg-orange-500 text-white'
                  : pillInactive
              }`}
            >
              HN Popular
            </button>
          </div>
        </div>

        {/* View toggles: Saved-only & Hide-read */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <button
            onClick={() => setShowSavedOnly((v) => !v)}
            className={`${pillBase} inline-flex items-center gap-1.5 ${
              showSavedOnly ? pillActive : pillInactive
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={showSavedOnly ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            Saved{savedCount > 0 ? ` (${savedCount})` : ''}
          </button>
          <button
            onClick={() => setHideRead((v) => !v)}
            className={`${pillBase} ${hideRead ? pillActive : pillInactive}`}
          >
            {hideRead ? 'Showing unread' : 'Hide read'}
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-pulse text-[var(--muted)]">
              Loading feeds...
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 text-red-500 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Feed Items */}
        {!loading && !error && filteredAndSortedItems && (
          <div className="space-y-1">
            {filteredAndSortedItems.map((item, index) => {
              const isSaved = bookmarks.set.has(item.link);
              const isRead = read.set.has(item.link);
              return (
                <div
                  key={`${item.link}-${index}`}
                  className={`py-3 px-4 -mx-4 rounded-lg hover:bg-[var(--card)] transition-colors group ${
                    isRead ? 'opacity-55' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Bookmark toggle */}
                    <button
                      onClick={() => bookmarks.toggle(item.link)}
                      aria-label={isSaved ? 'Remove bookmark' : 'Save for later'}
                      title={isSaved ? 'Remove bookmark' : 'Save for later'}
                      className={`shrink-0 mt-0.5 p-1 -ml-1 rounded transition-colors cursor-pointer ${
                        isSaved
                          ? 'text-[var(--accent)]'
                          : 'text-[var(--border)] hover:text-[var(--muted)]'
                      }`}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    </button>

                    <div className="flex-1 min-w-0">
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => read.add(item.link)}
                        className="block"
                      >
                        <h2 className="post-title font-medium text-[var(--foreground)]">
                          {item.title}
                        </h2>
                      </a>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-sm">
                        <span className="text-[var(--muted)]">{item.source}</span>
                        <span className="text-[var(--border)]">•</span>
                        <span className="text-[var(--muted)]">
                          {formatTimeAgo(item.pubDate)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            categoryColors[item.category] ||
                            'bg-gray-500/20 text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {item.category}
                        </span>
                        {isRead && (
                          <span className="text-xs text-[var(--muted)]">· read</span>
                        )}
                        {item.hn && (
                          <a
                            href={item.hn.hnUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs bg-orange-500/20 text-orange-600 dark:text-orange-400 hover:bg-orange-500/30 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg
                              className="w-3 h-3"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                            {item.hn.score} pts
                            {item.hn.comments > 0 && (
                              <span className="opacity-70">
                                · {item.hn.comments}
                              </span>
                            )}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredAndSortedItems?.length === 0 && (
          <div className="text-center py-20 text-[var(--muted)]">
            {query || showSavedOnly || hideRead || filter !== 'all'
              ? 'No posts match your filters.'
              : 'No posts found.'}
          </div>
        )}

        {/* Stats & Last Updated */}
        {data && (
          <div className="mt-12 pt-8 border-t border-[var(--border)] text-center text-sm text-[var(--muted)]">
            <p>
              {data.items.length} posts · {hnCount} featured on Hacker News
              {savedCount > 0 ? ` · ${savedCount} saved` : ''}
            </p>
            <p className="mt-1">
              Last updated: {new Date(data.lastUpdated).toLocaleString()}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
