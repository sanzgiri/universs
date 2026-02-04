import Parser from 'rss-parser';

export interface FeedItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  sourceUrl: string;
  category: string;
}

export interface FeedConfig {
  url: string;
  category: string;
}

export interface FeedSettings {
  postsPerFeed: number;
  maxFeeds: number;
  refreshIntervalMinutes: number;
}

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'UniverssRSSReader/1.0',
  },
});

export async function fetchFeed(feedConfig: FeedConfig, postsPerFeed: number): Promise<FeedItem[]> {
  try {
    const feed = await parser.parseURL(feedConfig.url);
    const items = feed.items.slice(0, postsPerFeed).map((item) => ({
      title: item.title || 'Untitled',
      link: item.link || '#',
      pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
      source: feed.title || new URL(feedConfig.url).hostname,
      sourceUrl: feed.link || feedConfig.url,
      category: feedConfig.category,
    }));
    return items;
  } catch (error) {
    console.error(`Failed to fetch feed ${feedConfig.url}:`, error);
    return [];
  }
}

export async function fetchAllFeeds(
  feeds: FeedConfig[],
  settings: FeedSettings
): Promise<FeedItem[]> {
  const feedsToFetch = feeds.slice(0, settings.maxFeeds);

  const results = await Promise.allSettled(
    feedsToFetch.map((feed) => fetchFeed(feed, settings.postsPerFeed))
  );

  const allItems: FeedItem[] = [];
  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      allItems.push(...result.value);
    }
  });

  // Sort by date, newest first
  allItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  return allItems;
}
