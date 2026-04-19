# Delta Reporter

**Marketing-to-Engineering Coverage Gap Analysis for Trail of Bits**

Delta Reporter is a web app that automatically compares GitHub repository activity across the Trail of Bits family of organizations against their blog coverage — surfacing "Hidden Gems": actively maintained tools that have never been written about.

![Built with Next.js](https://img.shields.io/badge/built%20with-Next.js%2014-black?style=flat-square&logo=next.js) ![Deployed on Vercel](https://img.shields.io/badge/deployed%20on-Vercel-black?style=flat-square&logo=vercel) ![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=flat-square&logo=typescript)

---

## What It Does

Trail of Bits maintains hundreds of open-source repositories across three GitHub organizations:

- **[trailofbits](https://github.com/trailofbits)** — core security research tools
- **[crytic](https://github.com/crytic)** — smart contract security tooling
- **[lifting-bits](https://github.com/lifting-bits)** — binary analysis and lifting

Blog coverage on [blog.trailofbits.com](https://blog.trailofbits.com) and the [opensource page](https://www.trailofbits.com/opensource/) doesn't always keep pace with engineering activity. Delta Reporter runs the diff automatically:

1. **Fetches** all public, non-archived repos from all three orgs via the GitHub API
2. **Scrapes** blog post titles from the RSS feed and tool mentions from the opensource page
3. **Computes** an activity score per repo (weighted combination of stars + recency of last push)
4. **Flags** repos as "Hidden Gems" if they have high activity but zero blog coverage

The result is an up-to-date ranked list of tools most likely to benefit from a marketing push.

---

## Features

- **Hidden Gems grid** — amber-highlighted cards for every un-blogged, high-activity repo, sorted by activity score
- **Full repo table** — sortable by name, stars, last push, or activity score; filterable by org; searchable by name or description
- **Blog coverage breakdown** — per-org coverage bars + collapsible list of every scraped blog post
- **Stats bar** — total repos analyzed, hidden gem count, overall coverage %, orgs scanned
- **Dark / light mode** — toggle in the header, preference persisted to `localStorage`
- **Stale-while-revalidate caching** — today's result is cached in `localStorage` so the UI loads instantly on repeat visits while a fresh fetch runs in the background
- **Rate limit warning** — a banner appears automatically when no GitHub token is configured

---

## How the "Hidden Gem" Score Works

Each repo gets an **activity score** combining star count (log-scaled) and recency:

```
activityScore = log10(max(1, stars)) × 0.6 + recencyScore × 0.4

recencyScore  = max(0, 365 - daysSinceLastPush) / 365
```

A repo is classified as a **Hidden Gem** when all of the following are true:

| Condition | Default threshold |
|-----------|-------------------|
| Not archived | — |
| Not a fork | — |
| Stars ≥ threshold | `GEM_MIN_STARS=5` |
| Last push within N days | `GEM_MIN_DAYS_SINCE_PUSH=180` |
| Name not found in blog/opensource corpus | — |

Both thresholds are configurable via environment variables.

---

## Local Development

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
# Clone the repo
git clone https://github.com/DWHolbar/metamorph.git
cd metamorph

# Install dependencies
npm install

# (Optional but strongly recommended) Add your GitHub token
cp .env.example .env.local
# Edit .env.local and set: GITHUB_TOKEN=ghp_your_token_here

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The page shows a loading skeleton immediately, then fetches live data from `/api/delta`.

> **First load takes 5–20 seconds** — the API call fetches repos from GitHub and scrapes two websites in parallel. Subsequent visits load instantly from cache.

---

## Environment Variables

Create a `.env.local` file (copy from `.env.example`):

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GITHUB_TOKEN` | No | — | GitHub Personal Access Token. Without it: 60 API requests/hour. With it: 5,000/hour. Create one at [github.com/settings/tokens](https://github.com/settings/tokens) — no special scopes needed for public repos. |
| `GEM_MIN_STARS` | No | `5` | Minimum star count for a repo to qualify as a Hidden Gem candidate. |
| `GEM_MIN_DAYS_SINCE_PUSH` | No | `180` | A repo must have been pushed within this many days to qualify. |

---

## Deploying to Vercel

### Steps

1. Push this repo to GitHub (if not already done)
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository
3. Vercel auto-detects Next.js — no build configuration needed
4. Under **Settings → Environment Variables**, add:
   - `GITHUB_TOKEN` — your GitHub PAT (strongly recommended)
5. Click **Deploy**

### Hobby vs Pro tier

The `/api/delta` route scrapes multiple sources and can take 10–30 seconds on a cold start. The included `vercel.json` sets `maxDuration: 60` for that route, which requires **Vercel Pro**.

On the **Hobby tier**, either remove `vercel.json` entirely or delete the `functions` block inside it. The 10-second default limit means cold starts may occasionally time out, but repeat visits serve instantly from Vercel's edge cache.

---

## Project Structure

```
metamorph/
├── .env.example              # Environment variable template
├── next.config.mjs           # Next.js config
├── tailwind.config.ts        # Tailwind theme (dark mode, fonts)
├── tsconfig.json             # TypeScript config
├── vercel.json               # Vercel function timeout config (Pro only)
└── src/
    ├── app/
    │   ├── layout.tsx        # Root layout, Google Fonts, dark-mode script
    │   ├── page.tsx          # Entry point — renders <Dashboard />
    │   ├── globals.css       # Tailwind directives + theme transitions
    │   └── api/
    │       └── delta/
    │           └── route.ts  # GET /api/delta — the core data endpoint
    ├── components/
    │   ├── Dashboard.tsx     # Client root: fetch, localStorage cache, state
    │   ├── Header.tsx        # Sticky header with last-updated timestamp
    │   ├── ThemeToggle.tsx   # Dark/light toggle button
    │   ├── StatsBar.tsx      # Four summary stat cards
    │   ├── HiddenGems.tsx    # Section heading + gem card grid
    │   ├── GemCard.tsx       # Individual hidden gem card
    │   ├── RepoTable.tsx     # Sortable, filterable, paginated repo table
    │   ├── BlogCoverage.tsx  # Per-org coverage bars + collapsible post list
    │   ├── RateLimitBanner.tsx  # Warning when GITHUB_TOKEN is absent
    │   └── LoadingSkeleton.tsx  # Animated skeleton for initial load
    └── lib/
        ├── types.ts          # Shared TypeScript interfaces
        ├── github.ts         # Paginated GitHub API fetching for all 3 orgs
        ├── scraper.ts        # RSS-first blog scraping + opensource page parsing
        └── delta.ts          # Activity score formula + hidden gem classifier
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 14](https://nextjs.org) (App Router) |
| Language | TypeScript 5 |
| Styling | [Tailwind CSS 3](https://tailwindcss.com) |
| HTML scraping | [cheerio](https://cheerio.js.org) |
| RSS parsing | [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser) |
| Date formatting | [date-fns](https://date-fns.org) |
| Deployment | [Vercel](https://vercel.com) |

---

## Intended Use Case

This tool was built for a Technical Marketing Manager context at Trail of Bits. A typical workflow looks like:

1. Open the deployed URL
2. Look at the **Hidden Gems** section — repos with engineering momentum but no marketing presence
3. Pick the highest-scoring gem (stars + recent activity)
4. Interview the engineers behind it
5. Write a blog post, social thread, or "FAQ for AI agents" section in the README

> *"I ran a custom delta-analysis script comparing your GitHub repo activity against blog.trailofbits.com. I found that tools like `scribe` are seeing high commit activity but are currently un-blogged. As your TMM, my first week would be interviewing the engineers behind it and turning that activity into a high-signal post."*
