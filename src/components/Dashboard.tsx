'use client';

import { useEffect, useState } from 'react';
import type { DeltaResult } from '@/lib/types';
import Header from './Header';
import StatsBar from './StatsBar';
import RepoTable from './RepoTable';
import BlogCoverage from './BlogCoverage';
import SocialFeed from './SocialFeed';
import LoadingSkeleton from './LoadingSkeleton';
import SiteGuide from './SiteGuide';
import {
  computeNewNotifications,
  getNotifications,
  saveNotifications,
  getPrevRepos,
  savePrevRepos,
} from '@/lib/notifications';
import {
  initProgress,
  isReturningUser,
  welcomeMessage,
  refreshVisit,
  getProgress,
} from '@/lib/userProgress';

// Hourly cache key — auto-refreshes every hour without any user action
const CACHE_KEY = `delta-${new Date().toISOString().slice(0, 13)}`;

export default function Dashboard() {
  const [data, setData] = useState<DeltaResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [welcomeMsg, setWelcomeMsg] = useState<string | null>(null);
  const [returning, setReturning] = useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  const [guideHighlight, setGuideHighlight] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Check returning user before first render
    if (isReturningUser()) setReturning(true);
    initProgress();

    // Show cached data immediately for fast perceived load
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        setData(JSON.parse(raw) as DeltaResult);
        setLoading(false);
        setIsStale(true);
      }
    } catch {}

    // Fetch fresh data
    fetch('/api/delta')
      .then((res) => {
        if (!res.ok) throw new Error(`Server responded ${res.status}`);
        return res.json() as Promise<DeltaResult>;
      })
      .then((fresh) => {
        setData(fresh);
        setLoading(false);
        setIsStale(false);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(fresh));
        } catch {}
        // Compute notifications by diffing against previous fetch
        try {
          const prev = getPrevRepos();
          const newNotifs = computeNewNotifications(prev, fresh.repos);
          if (newNotifs.length > 0) {
            saveNotifications([...newNotifs, ...getNotifications()]);
            window.dispatchEvent(new Event('metamorph-notifications-updated'));
          }
          savePrevRepos(fresh.repos);
        } catch {}
        // Update user progress and set welcome message for returning users
        try {
          refreshVisit(fresh.stats.totalRepos);
          const p = getProgress();
          if (p && returning) setWelcomeMsg(welcomeMessage(p, fresh.stats.totalRepos));
        } catch {}
      })
      .catch((err: unknown) => {
        if (!data) {
          setError(err instanceof Error ? err.message : String(err));
          setLoading(false);
        }
      });
    // Listen for AI guide highlight actions
    const guideHandler = (e: Event) => {
      const detail = (e as CustomEvent<{ repoNames: string[]; action: string }>).detail;
      if (detail.action === 'highlight') {
        setGuideHighlight(new Set(detail.repoNames));
        setTimeout(() => setGuideHighlight(new Set()), 8000);
      }
    };
    window.addEventListener('metamorph-guide-action', guideHandler);
    return () => window.removeEventListener('metamorph-guide-action', guideHandler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && !data) {
    return (
      <>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSkeleton />
        </main>
      </>
    );
  }

  if (error && !data) {
    return (
      <>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center">
          <div className="text-center p-8 rounded-2xl border border-red-300/40 dark:border-red-500/30 bg-red-50 dark:bg-red-950/20 max-w-md">
            <svg
              className="mx-auto mb-4 text-red-400"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="font-mono text-red-600 dark:text-red-400 font-medium mb-2">
              Failed to load data
            </p>
            <p className="text-sm text-gray-500 dark:text-zinc-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-lg text-sm transition-colors"
            >
              Retry
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header lastUpdated={data?.stats.lastUpdated} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Hero */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-zinc-100 mb-2">
            Repo Intelligence
          </h2>
          <p className="text-gray-500 dark:text-zinc-400 max-w-2xl">
            Live view of all open-source repos across{' '}
            <span className="text-blue-600 dark:text-blue-400 font-mono">trailofbits</span>,{' '}
            <span className="text-purple-600 dark:text-purple-400 font-mono">crytic</span>, and{' '}
            <span className="text-orange-600 dark:text-orange-400 font-mono">lifting-bits</span>
            {' '}— refreshes every hour automatically.
          </p>
          {/* Welcome-back banner for returning users */}
          {returning && welcomeMsg && !welcomeDismissed && (
            <div className="mt-3 flex items-center gap-3 px-4 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-sm text-emerald-700 dark:text-emerald-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              <span className="flex-1">Welcome back. {welcomeMsg}</span>
              <button onClick={() => setWelcomeDismissed(true)} className="shrink-0 text-emerald-400 dark:text-emerald-600 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          )}

          {isStale && (
            <p className="mt-2 text-xs text-gray-400 dark:text-zinc-600 flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              Showing cached data — refreshing in background…
            </p>
          )}
        </div>

        {/* Banners */}
        {data?.scrapeErrors && data.scrapeErrors.length > 0 && (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3 text-xs text-zinc-500 dark:text-zinc-500 space-y-1">
            {data.scrapeErrors.map((e, i) => (
              <p key={i} className="font-mono">{e}</p>
            ))}
          </div>
        )}

        {data && (
          <>
            <StatsBar stats={data.stats} />
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">
              <RepoTable repos={data.repos} guideHighlight={guideHighlight} />
              <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                <SocialFeed
                  newsArticles={data.newsArticles ?? []}
                  hnPosts={data.hnPosts ?? []}
                  tweets={data.tweets ?? []}
                />
              </div>
            </div>
            <BlogCoverage sources={data.blogSources} repos={data.repos} />
          </>
        )}
      </main>

      {data && <SiteGuide repos={data.repos} />}

      <footer className="border-t border-gray-200 dark:border-zinc-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between text-xs text-gray-400 dark:text-zinc-600">
          <span>Metamorph — Trail of Bits repo intelligence</span>
          <a
            href="https://github.com/trailofbits"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-600 dark:hover:text-zinc-400 transition-colors flex items-center gap-1"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            GitHub
          </a>
        </div>
      </footer>
    </>
  );
}
