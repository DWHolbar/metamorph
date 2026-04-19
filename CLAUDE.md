# CLAUDE.md — Delta Reporter

This file tells Claude Code how to work with this project.

## What this project is

**Delta Reporter** is a Next.js 14 web app deployed on Vercel. It:

1. Fetches all public GitHub repos from three Trail of Bits orgs (`trailofbits`, `crytic`, `lifting-bits`) via the GitHub REST API
2. Scrapes `blog.trailofbits.com` (RSS feed) and `trailofbits.com/opensource/` for tool mentions
3. Computes a coverage delta — repos with high activity but zero blog coverage are "Hidden Gems"
4. Lets users generate marketing content (tweets, blog posts, PR pitches, newsletters, etc.) for any repo using the Claude API (`claude-opus-4-7`)

## Commands

```bash
npm run dev      # Start dev server on http://localhost:3000
npm run build    # Type-check + production build (must pass before committing)
npm run lint     # ESLint
```

Always run `npm run build` before committing to catch TypeScript errors.

## Environment variables

Create `.env.local` (copy from `.env.example`):

```
GITHUB_TOKEN=ghp_...           # Optional but strongly recommended (5000 req/hr vs 60)
ANTHROPIC_API_KEY=sk-ant-...   # Required for Content Studio content generation
GEM_MIN_STARS=5                # Optional: minimum stars for Hidden Gem classification
GEM_MIN_DAYS_SINCE_PUSH=180    # Optional: recency threshold in days
```

## Key files

### Data pipeline
| File | Purpose |
|------|---------|
| `src/lib/types.ts` | All shared TypeScript interfaces. `Repo`, `DeltaResult`, `ContentType` live here. Edit this first when adding new fields. |
| `src/lib/github.ts` | `fetchAllOrgs()` — paginated GitHub API fetch for all 3 orgs. Returns `Repo[]`. |
| `src/lib/scraper.ts` | `scrapeBlog()` (RSS + HTML fallback) and `scrapeOpensourcePage()` (GitHub URL extraction). |
| `src/lib/delta.ts` | `computeDelta()` — activity score formula, Hidden Gem classification, `isNew` flag (created ≤ 30 days ago). |
| `src/lib/prompts.ts` | `buildPrompt(repo, contentType)` — all Claude prompts for the 8 content types. |

### API routes
| Route | Purpose |
|-------|---------|
| `GET /api/delta` | Main data endpoint. Runs github + scraper + delta in parallel. Cached with `force-dynamic`. |
| `POST /api/generate` | Content generation. Accepts `{ repo: Repo, contentType: ContentType }`, calls Claude API. |

### UI components
| Component | Purpose |
|-----------|---------|
| `Dashboard.tsx` | Client root for `/`. Fetches `/api/delta`, stale-while-revalidate via `localStorage`. |
| `ContentStudio.tsx` | Client root for `/content-studio`. Repo selector + content type grid + generate/copy flow. |
| `Header.tsx` | Sticky header with navigation (Dashboard / Content Studio) and theme toggle. `'use client'` because it uses `usePathname`. |
| `GemCard.tsx` | Hidden gem card with hover tooltip on star count explaining what GitHub stars are. |
| `RepoTable.tsx` | Sortable/filterable/paginated repo table. Stars column has inline tooltip. |
| `StatsBar.tsx` | 4 stat cards: total repos, hidden gems, blog coverage %, new repos (last 30 days). |

## Architecture decisions

- **Single `/api/delta` route** rather than separate `/api/repos` and `/api/blog-mentions` to minimize cold starts on Vercel Hobby tier.
- **RSS-first scraping**: `blog.trailofbits.com/feed/` is paginated up to 5 pages. Falls back to HTML scraping if RSS fails.
- **Activity score formula**: `log10(stars) * 0.6 + recencyScore * 0.4` where `recencyScore = max(0, 365 - daysSincePush) / 365`. Tunable.
- **`isNew` flag**: repos created within last 30 days. Hardcoded as `NEW_REPO_DAYS = 30` in `delta.ts`.
- **localStorage cache**: keyed by today's date (`delta-YYYY-MM-DD`). Gives instant perceived load on repeat visits while fresh data fetches in background.
- **`'use client'`** only on interactive components (`Dashboard`, `ContentStudio`, `Header`, `ThemeToggle`, `RepoTable`, `BlogCoverage`). Server components: `page.tsx` files.

## How to add a new content type

1. Add the new type to the `ContentType` union in `src/lib/types.ts`
2. Add a label to `CONTENT_TYPE_LABELS` in `src/lib/types.ts`
3. Add a `case` to the `switch` in `buildPrompt()` in `src/lib/prompts.ts`
4. Add an icon to `TYPE_ICONS` in `src/components/ContentStudio.tsx`

## How to add a new GitHub org to scan

1. Add the org name to `ORGS` array in `src/lib/github.ts`
2. Add it to `orgBreakdown` in `src/components/BlogCoverage.tsx`
3. Add a color to `ORG_DOT` in `src/components/RepoTable.tsx` and `ORG_COLORS` in `src/components/GemCard.tsx`
4. Update `OrgName` type in `src/lib/types.ts`
5. Update the description in `src/components/Dashboard.tsx` hero text

## Vercel deployment

- `vercel.json` sets `maxDuration: 60` for `/api/delta` — requires **Vercel Pro**. Delete the file if on Hobby tier.
- Add `GITHUB_TOKEN` and `ANTHROPIC_API_KEY` under **Vercel → Settings → Environment Variables**.
- Next.js auto-detected; no build config needed.

## Common issues

| Issue | Fix |
|-------|-----|
| `/api/delta` returns empty repos | Check `GITHUB_TOKEN` is valid and not expired |
| `/api/generate` returns 500 | Check `ANTHROPIC_API_KEY` is set and has credits |
| Build fails with type error | Run `npm run build` locally, fix TypeScript errors before pushing |
| Blog scraper returns 0 posts | `blog.trailofbits.com/feed/` may be unreachable; check network/CORS in Vercel logs |
| Dark mode flashes on load | The anti-flash `<script>` in `layout.tsx` reads `localStorage` before hydration — this is expected behavior |
