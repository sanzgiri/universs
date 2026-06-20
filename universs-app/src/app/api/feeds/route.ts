import { NextResponse } from 'next/server';
import { fetchAllFeeds, type FeedConfig } from '@/lib/rss';
import { enrichWithHNData } from '@/lib/hackernews';
import feedsConfig from '@/config/feeds.json';

// Revalidate the cached response once per day, matching the Vercel cron
// schedule in vercel.json ("0 8 * * *"). The Vercel Hobby plan only allows
// daily crons, so daily is the source of truth across the app.
export const revalidate = 86400;

async function buildResponse(feeds: FeedConfig[]) {
  const items = await fetchAllFeeds(feeds, feedsConfig.settings);
  const enrichedItems = await enrichWithHNData(items);
  return {
    items: enrichedItems,
    lastUpdated: new Date().toISOString(),
    settings: feedsConfig.settings,
  };
}

export async function GET() {
  try {
    return NextResponse.json(await buildResponse(feedsConfig.feeds));
  } catch (error) {
    console.error('Error fetching feeds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feeds' },
      { status: 500 }
    );
  }
}

// Accepts a user-supplied feed list (e.g. an imported OPML) and returns items
// for those feeds. The list lives in the client's localStorage; nothing is
// persisted server-side. Responses are not ISR-cached (per-user payload).
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const raw: unknown = body?.feeds;

    if (!Array.isArray(raw) || raw.length === 0) {
      return NextResponse.json(
        { error: 'Expected a non-empty "feeds" array.' },
        { status: 400 }
      );
    }

    // Validate + cap to avoid abuse / runaway fan-out.
    const feeds: FeedConfig[] = raw
      .filter(
        (f): f is FeedConfig =>
          !!f &&
          typeof (f as FeedConfig).url === 'string' &&
          /^https?:\/\//.test((f as FeedConfig).url)
      )
      .slice(0, feedsConfig.settings.maxFeeds)
      .map((f) => ({
        url: f.url,
        category: typeof f.category === 'string' && f.category ? f.category : 'Imported',
      }));

    if (feeds.length === 0) {
      return NextResponse.json(
        { error: 'No valid feed URLs found.' },
        { status: 400 }
      );
    }

    return NextResponse.json(await buildResponse(feeds));
  } catch (error) {
    console.error('Error fetching custom feeds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feeds' },
      { status: 500 }
    );
  }
}
