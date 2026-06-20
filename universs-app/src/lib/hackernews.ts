interface HNSearchResult {
  hits: Array<{
    objectID: string;
    title: string;
    url: string;
    points: number;
    num_comments: number;
    created_at: string;
  }>;
}

interface HNData {
  score: number;
  comments: number;
  hnUrl: string;
}

// Cache HN lookups to avoid hammering the API within a single regeneration.
// Entries expire after CACHE_TTL_MS so that HN scores refresh over time
// (a post can hit the front page hours after it's first seen). On serverless
// cold starts this map is empty anyway, so this only guards warm instances.
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const hnCache = new Map<string, { data: HNData | null; expires: number }>();

export async function getHNPopularity(url: string): Promise<HNData | null> {
  // Check cache first (ignore expired entries)
  const cached = hnCache.get(url);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  try {
    // Use Algolia HN Search API
    const searchUrl = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(url)}&restrictSearchableAttributes=url&hitsPerPage=1`;

    const response = await fetch(searchUrl, {
      headers: { 'User-Agent': 'UniverssRSSReader/1.0' },
    });

    if (!response.ok) {
      hnCache.set(url, { data: null, expires: Date.now() + CACHE_TTL_MS });
      return null;
    }

    const data: HNSearchResult = await response.json();

    if (data.hits && data.hits.length > 0) {
      const hit = data.hits[0];
      // Verify URL matches (Algolia search can be fuzzy)
      if (hit.url && (hit.url === url || url.includes(hit.url) || hit.url.includes(url))) {
        const hnData: HNData = {
          score: hit.points || 0,
          comments: hit.num_comments || 0,
          hnUrl: `https://news.ycombinator.com/item?id=${hit.objectID}`,
        };
        hnCache.set(url, { data: hnData, expires: Date.now() + CACHE_TTL_MS });
        return hnData;
      }
    }

    hnCache.set(url, { data: null, expires: Date.now() + CACHE_TTL_MS });
    return null;
  } catch (error) {
    console.error(`Failed to fetch HN data for ${url}:`, error);
    hnCache.set(url, { data: null, expires: Date.now() + CACHE_TTL_MS });
    return null;
  }
}

export async function enrichWithHNData<T extends { link: string }>(
  items: T[]
): Promise<(T & { hn: HNData | null })[]> {
  // Process in batches to avoid rate limiting
  const batchSize = 10;
  const results: (T & { hn: HNData | null })[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const enrichedBatch = await Promise.all(
      batch.map(async (item) => {
        const hn = await getHNPopularity(item.link);
        return { ...item, hn };
      })
    );
    results.push(...enrichedBatch);
  }

  return results;
}
