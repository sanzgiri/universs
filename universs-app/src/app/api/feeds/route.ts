import { NextResponse } from 'next/server';
import { fetchAllFeeds } from '@/lib/rss';
import { enrichWithHNData } from '@/lib/hackernews';
import feedsConfig from '@/config/feeds.json';

// Revalidate the cached response once per day, matching the Vercel cron
// schedule in vercel.json ("0 8 * * *"). The Vercel Hobby plan only allows
// daily crons, so daily is the source of truth across the app.
export const revalidate = 86400;

export async function GET() {
  try {
    const items = await fetchAllFeeds(feedsConfig.feeds, feedsConfig.settings);

    // Enrich with Hacker News data
    const enrichedItems = await enrichWithHNData(items);

    return NextResponse.json({
      items: enrichedItems,
      lastUpdated: new Date().toISOString(),
      settings: feedsConfig.settings,
    });
  } catch (error) {
    console.error('Error fetching feeds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feeds' },
      { status: 500 }
    );
  }
}
