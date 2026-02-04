'use client';

import { useEffect, useState, useCallback } from 'react';

interface FeedItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  sourceUrl: string;
  category: string;
}

interface FeedResponse {
  items: FeedItem[];
  lastUpdated: string;
  settings: {
    postsPerFeed: number;
    maxFeeds: number;
    refreshIntervalMinutes: number;
  };
}

const categoryColors: Record<string, string> = {
  Tech: 'bg-blue-500/20 text-blue-400',
  Security: 'bg-red-500/20 text-red-400',
  Apple: 'bg-gray-500/20 text-gray-400',
  AI: 'bg-purple-500/20 text-purple-400',
  Science: 'bg-green-500/20 text-green-400',
  Culture: 'bg-yellow-500/20 text-yellow-400',
  Math: 'bg-cyan-500/20 text-cyan-400',
  Hardware: 'bg-orange-500/20 text-orange-400',
  Gaming: 'bg-pink-500/20 text-pink-400',
  Design: 'bg-indigo-500/20 text-indigo-400',
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

export default function Home() {
  const [data, setData] = useState<FeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

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

    // Refresh every hour
    const interval = setInterval(fetchFeeds, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchFeeds]);

  const categories = data
    ? ['all', ...Array.from(new Set(data.items.map((item) => item.category)))]
    : ['all'];

  const filteredItems = data?.items.filter(
    (item) => filter === 'all' || item.category === filter
  );

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <h1 className="text-2xl font-bold tracking-tight">UNIVERSS</h1>
          <p className="text-[var(--muted)] text-sm mt-1">
            What&apos;s happening in tech right now?
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                filter === category
                  ? 'bg-white text-black'
                  : 'bg-[var(--card)] text-[var(--muted)] hover:text-white'
              }`}
            >
              {category === 'all' ? 'All' : category}
            </button>
          ))}
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
          <div className="bg-red-500/10 text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Feed Items */}
        {!loading && !error && filteredItems && (
          <div className="space-y-1">
            {filteredItems.map((item, index) => (
              <a
                key={`${item.link}-${index}`}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block py-3 px-4 -mx-4 rounded-lg hover:bg-[var(--card)] transition-colors group"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-medium text-[var(--foreground)] group-hover:text-white truncate">
                      {item.title}
                    </h2>
                    <div className="flex items-center gap-3 mt-1.5 text-sm">
                      <span className="text-[var(--muted)]">{item.source}</span>
                      <span className="text-[var(--border)]">•</span>
                      <span className="text-[var(--muted)]">
                        {formatTimeAgo(item.pubDate)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          categoryColors[item.category] ||
                          'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {item.category}
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredItems?.length === 0 && (
          <div className="text-center py-20 text-[var(--muted)]">
            No posts found for this category.
          </div>
        )}

        {/* Last Updated */}
        {data && (
          <div className="mt-12 pt-8 border-t border-[var(--border)] text-center text-sm text-[var(--muted)]">
            Last updated: {new Date(data.lastUpdated).toLocaleString()}
          </div>
        )}
      </main>
    </div>
  );
}
