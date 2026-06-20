import { feedsToOpml } from '@/lib/opml';
import feedsConfig from '@/config/feeds.json';

export const revalidate = 86400;

// Exports the built-in feed list as an OPML file for import into any reader.
export async function GET() {
  const opml = feedsToOpml(feedsConfig.feeds, 'Universs Feeds');
  return new Response(opml, {
    headers: {
      'Content-Type': 'text/x-opml; charset=utf-8',
      'Content-Disposition': 'attachment; filename="universs-feeds.opml"',
      'Cache-Control': 's-maxage=86400, stale-while-revalidate',
    },
  });
}
