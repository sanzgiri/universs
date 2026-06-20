# Universs

A minimalist blog feed tracker that aggregates posts from 92 popular tech blogs and shows their Hacker News popularity.

**[→ Live demo](https://universs-xi.vercel.app)**

![Universs screenshot](docs/screenshot.png)

> _Built with Next.js 16 (App Router), TypeScript, Tailwind CSS, and the Algolia Hacker News API._

## Features

- **92 RSS/Atom feeds** from top Hacker News blogs
- **Hacker News integration** - See which posts made it to HN with scores and comment counts
- **Search** - Instant client-side search across post titles and sources
- **Bookmarks** - Save posts for later (stored in your browser, `localStorage`)
- **Read/unread tracking** - Clicked posts are dimmed; toggle to hide read items
- **Category filtering** - Tech, Security, AI, Science, Culture, and more
- **Sort options** - Recent or HN Popular
- **Light & dark themes** - Toggle in the header (uses Slack's Lato typeface), remembered across visits
- **Keyboard shortcuts** - `j`/`k` navigate, `o`/`Enter` open, `s` save, `m` mark read, `/` search, `?` help
- **Social sharing** - Per-post share to X/Twitter, LinkedIn, Mastodon, Reddit, or copy link
- **OPML import/export** - Import your own feed list or export the built-in one
- **Combined RSS output** - Subscribe to all sources at once via `/api/feed.xml`
- **PWA / offline** - Installable, with offline reading of the last-fetched posts
- **Configurable** - Easy to add/remove feeds via JSON config
- **Age filtering** - Only shows posts from the last 30 days (configurable)
- **Daily refresh** - Automatically fetches new posts via Vercel Cron

> **Note on storage:** Search, bookmarks, read-tracking, theme, and imported
> feed lists all live entirely in your browser (`localStorage` / Cache API).
> Nothing is stored server-side, so the app runs on Vercel's free tier with no
> database. Bookmarks/read-state are therefore per-device.

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe code
- **Tailwind CSS** - Utility-first styling
- **rss-parser** - RSS/Atom feed parsing
- **Algolia HN API** - Hacker News popularity data

## Local Development

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
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Deploy to Vercel

### Option 1: GitHub Integration (Recommended)

1. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/universs.git
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your `universs` repo
   - Click "Deploy"

3. **Done!** Vercel will:
   - Build and deploy automatically
   - Set up the daily cron job for feed refresh
   - Redeploy on every push to main

### Option 2: Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```
   This opens a browser to authenticate.

3. **Deploy**
   ```bash
   # From the universs-app directory
   vercel
   ```
   - Select "Y" to set up and deploy
   - Choose your Vercel scope/team
   - Accept default project name or customize
   - Accept default settings

4. **Deploy to Production**
   ```bash
   vercel --prod
   ```

5. **Your site is live!** Vercel will output the URL like:
   ```
   https://universs-abc123.vercel.app
   ```

### Vercel Configuration

The `vercel.json` file configures:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "crons": [
    {
      "path": "/api/feeds",
      "schedule": "0 8 * * *"
    }
  ]
}
```

- **Cron job** runs daily (08:00 UTC) to refresh feed cache
- **ISR** (Incremental Static Regeneration) caches API responses for 24 hours

> **Note:** The Vercel Hobby plan only permits daily cron jobs. If you are on a
> Pro plan and want more frequent refreshes, change the cron `schedule` in
> `vercel.json`, set `export const revalidate` in `src/app/api/feeds/route.ts`
> to match, and update `refreshIntervalMinutes` in `src/config/feeds.json`.

### Custom Domain (Optional)

1. Go to your project on [vercel.com](https://vercel.com)
2. Navigate to Settings → Domains
3. Add your custom domain
4. Update DNS as instructed

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

### Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `postsPerFeed` | 3 | Number of posts to fetch per feed |
| `maxFeeds` | 100 | Maximum feeds to process |
| `refreshIntervalMinutes` | 1440 | Client-side refresh interval (minutes) |
| `maxAgeDays` | 30 | Filter out posts older than this |

### Categories

Available: Tech, Security, AI, Science, Culture, Math, Hardware, Gaming, Design, Business, Apple

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

### POST /api/feeds

Returns items for a **custom feed list** (used by OPML import). The list is
supplied by the client and is **not** stored server-side. Not ISR-cached.

```json
// Request body
{ "feeds": [ { "url": "https://example.com/feed.xml", "category": "Tech" } ] }
```

Invalid or non-`http(s)` URLs are dropped; the list is capped to `maxFeeds`.

### GET /api/feed.xml

A combined **RSS 2.0** feed of all sources (built-in list). Cached via ISR for
24 hours. Subscribe to it in any RSS reader, or auto-discover it via the
`<link rel="alternate" type="application/rss+xml">` in the page `<head>`.

### GET /api/feeds.opml

Exports the built-in feed list as an **OPML 2.0** file (grouped by category)
for import into other readers. Returned as a download.

## How Refresh Works

1. **Vercel Cron** - Hits `/api/feeds` daily (08:00 UTC) to regenerate cache
2. **ISR** - API responses cached for 24 hours (`revalidate = 86400`)
3. **Client** - Browser checks for updates on the configured interval (default daily)

## License

MIT
