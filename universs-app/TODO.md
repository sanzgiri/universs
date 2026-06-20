# TODO

> **Status legend:** ✅ done · ⬜ not started · 🔒 needs backend/persistent storage

## High Priority

- [x] ✅ **Search** - Full-text search across post titles (client-side, in-memory)
- [x] ✅ **Bookmarks/Favorites** - Save posts to read later (`localStorage`)
- [x] ✅ **Read/Unread tracking** - Mark posts you've already clicked (`localStorage`)

## Medium Priority

- [x] ✅ **OPML import/export** - Import your own feed list (stored in `localStorage`,
      sent to `POST /api/feeds`); export built-in list via `/api/feeds.opml`
- [x] ✅ **Dark/Light theme toggle** - Light + dark palettes via `[data-theme]`,
      persisted to `localStorage`, no-FOUC init script
- [x] ✅ **Keyboard shortcuts** - `j`/`k`, `o`/`Enter`, `s`, `m`, `/`, `?`, `Esc`
- [x] ✅ **PWA support** - `manifest.webmanifest` + service worker (offline reading
      of the last-fetched feed via the browser Cache API)

## Low Priority

- [ ] 🔒 **Email digest** - Daily/weekly summary of top posts
      **(NOT done — requires a database + cron + email provider; only item that
      needs server-side persistent storage)**
- [x] ✅ **RSS output** - Combined feed of all sources at `/api/feed.xml`
- [x] ✅ **Social sharing** - Share buttons for X/Twitter, LinkedIn, Mastodon, Reddit, copy link

## Infrastructure

- [ ] **Database** - Persist HN scores over time to track trending
- [ ] **Caching layer** - Redis/Upstash for faster feed fetches
- [ ] **Error monitoring** - Sentry integration
- [ ] **Analytics** - Track which posts get clicked

## Feed Improvements

- [ ] **Auto-discover feeds** - Given a blog URL, find the RSS feed
- [ ] **Feed health monitoring** - Track which feeds are failing
- [x] ✅ **Duplicate detection** - Cross-posted articles deduped by normalized URL
- [ ] **Content snippets** - Show first paragraph/summary when available

## UI Enhancements

- [ ] **Infinite scroll** - Load more posts as you scroll
- [ ] **Grid view** - Alternative card-based layout
- [ ] **Source grouping** - Group posts by source instead of chronological
- [ ] **Time-based filtering** - Today, This Week, This Month

---

## Changelog (what changed, what didn't)

### Bug fixes
- HN score cache now expires (1h TTL) so scores refresh as posts climb HN.
- Cross-posted duplicates removed via normalized-URL dedup.
- `refreshIntervalMinutes` config is now actually honored by the client.
- Cron / ISR / client refresh cadence unified to **daily** (Vercel Hobby limit).
- Fixed `FeedResponse` type to include `maxAgeDays`.

### Features added (all client-side / no server storage)
- Search, bookmarks, read/unread tracking (`localStorage`).
- Light/dark theme toggle (Lato font, Slack's UI typeface).
- Keyboard shortcuts + help overlay.
- Social sharing menu per post.
- OPML import (parsed in-browser, stored in `localStorage`, fetched via
  `POST /api/feeds`) and export (`/api/feeds.opml`).
- Combined RSS output at `/api/feed.xml` (ISR-cached).
- PWA: web manifest + service worker for offline reading (browser Cache API).

### Explicitly NOT done
- **Email digest** — deferred. It is the only remaining priority item that
  needs server-side persistent storage (subscriber DB), a scheduled job, and a
  third-party email provider (e.g. Resend/SendGrid). Everything else above
  runs on Vercel's free tier with no database.
- OPML import is **per-device** (stored in `localStorage`). Cross-device sync
  of a custom feed list would require a database and is out of scope.
