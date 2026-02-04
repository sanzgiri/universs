import { NextResponse } from 'next/server';
import { fetchAllFeeds } from '@/lib/rss';
import feedsConfig from '@/config/feeds.json';

// Cache the response for 1 hour (3600 seconds)
export const revalidate = 3600;

export async function GET() {
  try {
    const items = await fetchAllFeeds(feedsConfig.feeds, feedsConfig.settings);

    return NextResponse.json({
      items,
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
