import type { Metadata } from 'next';
import Header from '@/components/Header';
import CodeBlock from '@/components/CodeBlock';

export const metadata: Metadata = {
  title: 'Code Showcase — Metamorph',
  description: 'Copy-paste TypeScript patterns used in Metamorph: custom event bus, parallel data fetching, IntersectionObserver scroll animations, and more.',
};

const SNIPPETS = [
  {
    title: 'Parallel Data Fetching with Timeouts',
    description: 'Run multiple external fetches concurrently using Promise.allSettled. Each fetch has an individual timeout via AbortSignal so one slow source never blocks the others.',
    language: 'typescript',
    code: `async function safeFetch(url: string, timeoutMs = 4000): Promise<Response | null> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return res.ok ? res : null;
  } catch {
    clearTimeout(id);
    return null;
  }
}

// All sources run in parallel — slow or failing sources don't block others
const [githubResult, blogResult, hnResult] = await Promise.allSettled([
  fetchGitHubRepos(),
  scrapeBlog(),
  fetchHNPosts(),
]);

const repos  = githubResult.status === 'fulfilled' ? githubResult.value : [];
const posts  = blogResult.status  === 'fulfilled' ? blogResult.value  : [];
const hnData = hnResult.status    === 'fulfilled' ? hnResult.value    : [];`,
  },
  {
    title: 'Racing Multiple Fallback Sources',
    description: 'When you have many equivalent endpoints (CDN mirrors, public APIs), race them all simultaneously and take the first successful response. Avoids sequential timeouts.',
    language: 'typescript',
    code: `const MIRRORS = [
  'https://api-1.example.com/feed',
  'https://api-2.example.com/feed',
  'https://api-3.example.com/feed',
];

async function fetchFromMirror(url: string): Promise<Data[]> {
  const res = await safeFetch(url, 3000);
  if (!res) throw new Error('no response');
  const data = await res.json() as { items?: Data[] };
  if (!data.items?.length) throw new Error('empty');
  return data.items;
}

// First mirror to respond with valid data wins
// Promise.any rejects only if ALL mirrors fail
try {
  const results = await Promise.any(MIRRORS.map(fetchFromMirror));
  return results;
} catch {
  return []; // all mirrors failed or timed out
}`,
  },
  {
    title: 'Custom Event Bus (Cross-Component)',
    description: 'Dispatch actions between isolated React trees without prop drilling or a state management library. Uses the browser\'s native CustomEvent API.',
    language: 'typescript',
    code: `// ── Dispatch from any component ─────────────────────────────────────────────
window.dispatchEvent(
  new CustomEvent('app-action', {
    detail: { type: 'highlight', ids: ['repo-1', 'repo-2'] },
  })
);

// ── Listen in another component ──────────────────────────────────────────────
useEffect(() => {
  type ActionDetail = { type: string; ids: string[] };

  const handler = (e: Event) => {
    const { type, ids } = (e as CustomEvent<ActionDetail>).detail;
    if (type === 'highlight') {
      setHighlighted(new Set(ids));
      setTimeout(() => setHighlighted(new Set()), 8000); // auto-clear
    }
  };

  window.addEventListener('app-action', handler);
  return () => window.removeEventListener('app-action', handler);
}, []);`,
  },
  {
    title: 'IntersectionObserver Scroll Animations',
    description: 'Animate elements into view as the user scrolls using the native IntersectionObserver API. No animation library needed — pure CSS transitions triggered by a class swap.',
    language: 'typescript',
    code: `'use client';
import { useEffect, useRef } from 'react';

export default function AnimatedSection({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.transitionDelay = \`\${delay}ms\`;
          el.classList.add('opacity-100', 'translate-y-0');
          observer.unobserve(el); // fire once
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className="opacity-0 translate-y-8 transition-all duration-700 ease-out"
    >
      {children}
    </div>
  );
}`,
  },
  {
    title: 'Stale-While-Revalidate with localStorage',
    description: 'Show cached data immediately for instant perceived load, then fetch fresh data in the background and update the UI. Hourly cache key auto-expires without any cleanup logic.',
    language: 'typescript',
    code: `// Cache key rotates every hour automatically
const CACHE_KEY = \`data-\${new Date().toISOString().slice(0, 13)}\`;

useEffect(() => {
  // 1. Show cached data immediately (instant paint)
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      setData(JSON.parse(raw));
      setLoading(false);
      setIsStale(true);
    }
  } catch {}

  // 2. Fetch fresh data in background
  fetch('/api/data')
    .then((r) => r.json())
    .then((fresh) => {
      setData(fresh);
      setIsStale(false);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(fresh)); } catch {}
    })
    .catch((err) => {
      // Only show error if we have no cached data to fall back on
      if (!data) setError(String(err));
    });
}, []);`,
  },
];

export default function ShowcasePage() {
  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-zinc-100 mb-3">
            Code Showcase
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 max-w-2xl">
            TypeScript patterns used throughout Metamorph. Each snippet is self-contained
            and copy-paste ready.
          </p>
        </div>

        <div className="space-y-10">
          {SNIPPETS.map((s) => (
            <section key={s.title}>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-1">{s.title}</h2>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mb-3">{s.description}</p>
              <CodeBlock title={s.title} language={s.language} code={s.code} />
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
