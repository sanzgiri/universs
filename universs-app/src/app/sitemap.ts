import type { MetadataRoute } from 'next';

const SITE_URL = 'https://universs-xi.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      // The combined RSS feed of all sources is a discoverable resource too.
      url: `${SITE_URL}/api/feed.xml`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.6,
    },
  ];
}
