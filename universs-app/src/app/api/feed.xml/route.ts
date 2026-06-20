import { fetchAllFeeds } from '@/lib/rss';
import feedsConfig from '@/config/feeds.json';

// Generated on the fly from the same feed data; cached by ISR for a day
// (matches /api/feeds and the daily Vercel cron). No persistent storage.
export const revalidate = 86400;

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(request: Request) {
  const items = await fetchAllFeeds(feedsConfig.feeds, feedsConfig.settings);

  // Derive the site origin so links resolve regardless of deploy domain.
  const origin = new URL(request.url).origin;
  const now = new Date().toUTCString();

  const entries = items
    .map((item) => {
      const title = escapeXml(item.title);
      const link = escapeXml(item.link);
      const source = escapeXml(item.source);
      const category = escapeXml(item.category);
      const pubDate = new Date(item.timestamp).toUTCString();
      return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <dc:creator>${source}</dc:creator>
      <category>${category}</category>
      <pubDate>${pubDate}</pubDate>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Universs</title>
    <link>${origin}</link>
    <atom:link href="${origin}/api/feed.xml" rel="self" type="application/rss+xml" />
    <description>Aggregated posts from popular tech blogs, with Hacker News popularity.</description>
    <language>en</language>
    <lastBuildDate>${now}</lastBuildDate>
${entries}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 's-maxage=86400, stale-while-revalidate',
    },
  });
}
