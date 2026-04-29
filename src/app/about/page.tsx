import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import BlueprintSection from '@/components/BlueprintSection';

export const metadata: Metadata = {
  title: 'Blueprint — How Metamorph Works',
  description: 'A technical walkthrough of how Metamorph aggregates GitHub repos, scrapes blog coverage, computes hidden gems, and renders a real-time 3D visualization with an AI guide.',
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-24">

        {/* Hero */}
        <BlueprintSection>
          <div className="text-center">
            <p className="text-xs font-mono uppercase tracking-widest text-emerald-500 mb-4">Metamorph Blueprint</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-zinc-100 mb-5 leading-tight">
              How it works
            </h1>
            <p className="text-lg text-gray-500 dark:text-zinc-400 max-w-xl mx-auto">
              Metamorph is a live intelligence layer over Trail of Bits open-source work.
              Here&apos;s the full stack — from raw GitHub API calls to the 3D graph you see.
            </p>
          </div>
        </BlueprintSection>

        {/* The Problem */}
        <BlueprintSection delay={100}>
          <Step number="01" label="The Problem">
            <p className="text-gray-500 dark:text-zinc-400 mb-4">
              Trail of Bits maintains hundreds of open-source tools across three GitHub orgs.
              Many of these repos have real engineering activity — commits, stars, contributors —
              but receive zero blog or press coverage.
            </p>
            <p className="text-gray-500 dark:text-zinc-400 mb-4">
              The marketing team can&apos;t read GitHub. The engineering team doesn&apos;t write blogs.
              The result: valuable tools go undiscovered. We call these <strong className="text-amber-500">Hidden Gems</strong>.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-4">
              {[
                { org: 'trailofbits', color: 'text-blue-500', desc: 'security tools, formal verification, crypto' },
                { org: 'crytic', color: 'text-purple-500', desc: 'smart contract auditing, fuzzing, Slither' },
                { org: 'lifting-bits', color: 'text-orange-500', desc: 'binary lifting, remill, anvill' },
              ].map((o) => (
                <div key={o.org} className="rounded-xl border border-gray-200 dark:border-zinc-800 p-3">
                  <p className={`font-mono text-xs font-bold ${o.color}`}>{o.org}</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-600 mt-1">{o.desc}</p>
                </div>
              ))}
            </div>
          </Step>
        </BlueprintSection>

        {/* Data Pipeline */}
        <BlueprintSection delay={100}>
          <Step number="02" label="Data Pipeline">
            <p className="text-gray-500 dark:text-zinc-400 mb-6">
              On every request to <code className="text-xs font-mono bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">GET /api/delta</code>,
              three fetches run in parallel:
            </p>
            <ol className="space-y-4">
              {[
                {
                  step: 'GitHub REST API',
                  detail: 'Paginated fetch of all public, non-archived repos from 3 orgs. Authenticated with GITHUB_TOKEN for 5000 req/hr. Returns name, stars, pushedAt, topics, language.',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  ),
                },
                {
                  step: 'Blog scraper',
                  detail: 'Paginated RSS fetch from blog.trailofbits.com/feed/ (5 pages). Falls back to HTML scraping via cheerio if RSS fails. Returns post titles and URLs.',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  ),
                },
                {
                  step: 'Delta computation',
                  detail: 'For each repo, checks if the repo name appears in the blog corpus. activityScore = log10(stars)*0.6 + recency*0.4. A repo is a Hidden Gem if uncovered AND activityScore > threshold.',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                    </svg>
                  ),
                },
              ].map((item, i) => (
                <li key={i} className="flex gap-4">
                  <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200 mb-1">{item.step}</p>
                    <p className="text-sm text-gray-500 dark:text-zinc-400">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Step>
        </BlueprintSection>

        {/* 3D Graph */}
        <BlueprintSection delay={100}>
          <Step number="03" label="3D Visualization">
            <p className="text-gray-500 dark:text-zinc-400 mb-4">
              The <Link href="/3d" className="text-blue-500 hover:underline">3D graph</Link> renders
              every repo as a sphere in a Three.js canvas via React Three Fiber. Key design decisions:
            </p>
            <ul className="space-y-3">
              {[
                ['Fibonacci sphere layout', 'Each org cluster arranges its repos on a sphere surface using the golden angle — evenly distributed with no poles or clustering.'],
                ['Node size = log10(stars)', 'Star count maps to sphere radius via a log scale so repos with 10k stars don\'t dwarf everything else.'],
                ['Emissive pulse for Hidden Gems', 'Amber repos pulse with sin(time) on their emissiveIntensity — drawing the eye without requiring interaction.'],
                ['Device-aware LOD', 'On first render, detectCapabilities() checks hardwareConcurrency and screen width. Mobile gets 8-segment spheres and 800 stars; desktop gets 20-segment and 3000.'],
                ['Camera fly-to', 'When the AI guide identifies a repo, a CameraController lerps camera.position toward the world-space position of the target node over ~1.5s.'],
              ].map(([term, detail]) => (
                <li key={term} className="flex gap-3">
                  <span className="text-emerald-500 mt-1 shrink-0">▸</span>
                  <p className="text-sm text-gray-500 dark:text-zinc-400">
                    <strong className="text-gray-800 dark:text-zinc-200">{term}:</strong>{' '}{detail}
                  </p>
                </li>
              ))}
            </ul>
          </Step>
        </BlueprintSection>

        {/* AI Guide */}
        <BlueprintSection delay={100}>
          <Step number="04" label="AI Site Guide">
            <p className="text-gray-500 dark:text-zinc-400 mb-4">
              The floating chat widget sends your query to <code className="text-xs font-mono bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">POST /api/guide</code> along with
              up to 150 repos as minimal context (name, org, stars, description, isHiddenGem).
            </p>
            <p className="text-gray-500 dark:text-zinc-400 mb-4">
              Claude Opus 4.7 with adaptive thinking responds with structured JSON:
            </p>
            <pre className="text-xs font-mono bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4 mb-4 overflow-x-auto text-gray-700 dark:text-zinc-300">
{`{
  "message": "Here are the top Ethereum security tools...",
  "repoNames": ["slither", "echidna", "medusa"],
  "action": "fly-to"
}`}
            </pre>
            <p className="text-gray-500 dark:text-zinc-400">
              The response fires a <code className="text-xs font-mono bg-gray-100 dark:bg-zinc-800 px-1 rounded">metamorph-guide-action</code> CustomEvent.
              Both the Dashboard (table highlighting) and RepoGraph3D (camera fly-to + node pulse) listen for it.
            </p>
          </Step>
        </BlueprintSection>

        {/* Content Studio */}
        <BlueprintSection delay={100}>
          <Step number="05" label="Content Studio">
            <p className="text-gray-500 dark:text-zinc-400 mb-4">
              The <Link href="/content-studio" className="text-blue-500 hover:underline">Content Studio</Link> generates
              marketing content without any API calls for most types — it uses deterministic template strings
              filled with live repo metadata (name, org, stars, description, topics, language, blog mentions).
            </p>
            <p className="text-gray-500 dark:text-zinc-400 mb-4">
              For <strong className="text-gray-800 dark:text-zinc-200">testing-guide</strong> and{' '}
              <strong className="text-gray-800 dark:text-zinc-200">tool-review</strong>, the API fetches the
              repo&apos;s README from GitHub, extracts install/usage code blocks with regex, and injects real
              commands into the template. Zero LLM cost.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Template-based (8 types)', 'Zero cost, instant, deterministic'],
                ['README-augmented (2 types)', 'Fetches GitHub README, parses commands'],
                ['Variation cycling', '+1 counter seeds different phrase branches'],
                ['Pre-select from 3D', 'Hover any node → Generate content → auto-selects'],
              ].map(([feat, detail]) => (
                <div key={feat} className="rounded-xl border border-gray-200 dark:border-zinc-800 p-3">
                  <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200 mb-0.5">{feat}</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-600">{detail}</p>
                </div>
              ))}
            </div>
          </Step>
        </BlueprintSection>

        {/* CTA */}
        <BlueprintSection delay={100}>
          <div className="text-center border-t border-gray-200 dark:border-zinc-800 pt-16">
            <p className="text-gray-500 dark:text-zinc-400 mb-6">
              All of this runs on Vercel Hobby tier — no paid infrastructure required beyond the Anthropic API key.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href="/" className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors">
                Open Dashboard
              </Link>
              <Link href="/showcase" className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-semibold text-sm transition-colors">
                Browse Code Snippets
              </Link>
            </div>
          </div>
        </BlueprintSection>

      </main>
    </>
  );
}

function Step({ number, label, children }: { number: string; label: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-5">
        <span className="text-xs font-mono text-gray-400 dark:text-zinc-600">{number}</span>
        <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">{label}</h2>
        <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-800" />
      </div>
      {children}
    </section>
  );
}
