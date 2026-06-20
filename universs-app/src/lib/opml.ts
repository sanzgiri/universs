import type { FeedConfig } from './rss';

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Serialize a feed list to an OPML 2.0 document (groups feeds by category). */
export function feedsToOpml(feeds: FeedConfig[], title = 'Universs Feeds'): string {
  const byCategory = new Map<string, FeedConfig[]>();
  for (const feed of feeds) {
    const cat = feed.category || 'Uncategorized';
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(feed);
  }

  const body = [...byCategory.entries()]
    .map(([category, list]) => {
      const outlines = list
        .map(
          (f) =>
            `      <outline type="rss" text="${escapeXml(f.url)}" xmlUrl="${escapeXml(
              f.url
            )}" category="${escapeXml(category)}" />`
        )
        .join('\n');
      return `    <outline text="${escapeXml(category)}" title="${escapeXml(
        category
      )}">\n${outlines}\n    </outline>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>${escapeXml(title)}</title>
    <dateCreated>${new Date().toUTCString()}</dateCreated>
  </head>
  <body>
${body}
  </body>
</opml>`;
}

/**
 * Parse an OPML document into a feed list. Uses the nearest ancestor outline's
 * text/title as the category. Runs in the browser via DOMParser.
 */
export function opmlToFeeds(xml: string): FeedConfig[] {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.querySelector('parsererror')) {
    throw new Error('Invalid OPML/XML file');
  }

  const feeds: FeedConfig[] = [];
  const seen = new Set<string>();

  const outlines = Array.from(doc.querySelectorAll('outline'));
  for (const node of outlines) {
    const url = node.getAttribute('xmlUrl');
    if (!url) continue; // category container, not a feed

    if (seen.has(url)) continue;
    seen.add(url);

    // Prefer an explicit category attr, else the parent outline's label.
    let category = node.getAttribute('category') || '';
    if (!category) {
      const parent = node.parentElement;
      if (parent && parent.tagName.toLowerCase() === 'outline') {
        category =
          parent.getAttribute('title') || parent.getAttribute('text') || '';
      }
    }

    feeds.push({ url, category: category || 'Imported' });
  }

  return feeds;
}
