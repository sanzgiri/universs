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
- **Hourly refresh** - Automatically fetches new posts via Vercel Cron

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
   - Set up the hourly cron job for feed refresh
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
      "schedule": "0 * * * *"
    }
  ]
}
```

- **Cron job** runs hourly to refresh feed cache
- **ISR** (Incremental Static Regeneration) caches API responses for 1 hour

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
| `refreshIntervalMinutes` | 60 | Client-side refresh interval |
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

## How Refresh Works

1. **Vercel Cron** - Hits `/api/feeds` every hour to regenerate cache
2. **ISR** - API responses cached for 1 hour (`revalidate = 3600`)
3. **Client** - Browser checks for updates every hour

## License

MIT
