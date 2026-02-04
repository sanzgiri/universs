# Universs

A minimalist blog feed tracker that aggregates posts from 92 popular tech blogs and shows their Hacker News popularity.

## Features

- **92 RSS/Atom feeds** from top Hacker News blogs
- **Hacker News integration** - See which posts made it to HN with scores and comment counts
- **Category filtering** - Tech, Security, AI, Science, Culture, and more
- **Sort options** - Recent or HN Popular
- **Dark minimalist UI** - Inspired by worldstream.io
- **Configurable** - Easy to add/remove feeds via JSON config
- **Age filtering** - Only shows posts from the last 30 days (configurable)
- **Hourly refresh** - Automatically fetches new posts

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe code
- **Tailwind CSS** - Utility-first styling
- **rss-parser** - RSS/Atom feed parsing
- **Algolia HN API** - Hacker News popularity data

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Clone the repo
git clone <repo-url>
cd universs-app

# Install dependencies
npm install

# Run development server
npm run dev

# Or build and run production
npm run build
npm run start
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Configuration

Edit `src/config/feeds.json` to customize:

```json
{
  "settings": {
    "postsPerFeed": 3,
    "maxFeeds": 100,
    "refreshIntervalMinutes": 60,
    "maxAgeDays": 30
  },
  "feeds": [
    { "url": "https://example.com/feed.xml", "category": "Tech" }
  ]
}
```

### Categories

Available categories: Tech, Security, AI, Science, Culture, Math, Hardware, Gaming, Design, Business, Apple

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login and deploy
vercel login
vercel --prod
```

Or connect your GitHub repo at [vercel.com](https://vercel.com).

### Other Platforms

Works on any platform that supports Next.js:
- Netlify
- Railway
- Render
- Self-hosted with `npm run build && npm run start`

## API

### GET /api/feeds

Returns all feed items with HN data.

```json
{
  "items": [
    {
      "title": "Post Title",
      "link": "https://...",
      "pubDate": "2026-02-04T01:40:24.000Z",
      "timestamp": 1770169224000,
      "source": "Blog Name",
      "sourceUrl": "https://...",
      "category": "Tech",
      "hn": {
        "score": 298,
        "comments": 245,
        "hnUrl": "https://news.ycombinator.com/item?id=..."
      }
    }
  ],
  "lastUpdated": "2026-02-04T08:00:00.000Z",
  "settings": { ... }
}
```

## License

MIT
