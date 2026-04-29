'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { NewsArticle, HNPost, Tweet } from '@/lib/types';

type Tab = 'news' | 'hn' | 'twitter';

function RepoTags({ names }: { names: string[] }) {
  if (!names.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {names.map((n) => (
        <span key={n} className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-mono">
          {n}
        </span>
      ))}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

export default function SocialFeed({
  newsArticles,
  hnPosts,
  tweets,
}: {
  newsArticles: NewsArticle[];
  hnPosts: HNPost[];
  tweets: Tweet[];
}) {
  const [tab, setTab] = useState<Tab>('news');

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'news',    label: 'News',         count: newsArticles.length },
    { id: 'hn',      label: 'Hacker News',  count: hnPosts.length },
    { id: 'twitter', label: 'Twitter / X',  count: tweets.length },
  ];

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-100">
          Social &amp; Press
        </h2>
        <div className="flex items-center gap-1">
          <a
            href="https://x.com/trailofbits"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-gray-400 dark:text-zinc-600 hover:text-gray-700 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            title="@trailofbits on X"
          >
            {/* X icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          <a
            href="https://www.linkedin.com/company/trail-of-bits/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-gray-400 dark:text-zinc-600 hover:text-gray-700 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            title="Trail of Bits on LinkedIn"
          >
            {/* LinkedIn icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/>
              <circle cx="4" cy="4" r="2"/>
            </svg>
          </a>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-4 border-b border-gray-100 dark:border-zinc-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-emerald-500 text-gray-900 dark:text-zinc-100'
                : 'border-transparent text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300'
            }`}
          >
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-mono ${
              tab === t.id
                ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                : 'bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-600'
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* News tab */}
      {tab === 'news' && (
        <div className="space-y-1">
          {newsArticles.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-zinc-600 py-8 text-center">
              No news articles fetched — Bing News may be temporarily unavailable.
            </p>
          ) : (
            newsArticles.map((a, i) => (
              <a
                key={i}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col gap-0.5 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900/60 transition-colors group"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-sm text-gray-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug line-clamp-2">
                    {a.title}
                  </span>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-gray-300 dark:text-zinc-700 group-hover:text-emerald-400 mt-0.5 transition-colors">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-zinc-600">
                  <span className="font-medium">{a.source}</span>
                  {a.publishedAt && <span>· {timeAgo(a.publishedAt)}</span>}
                </div>
                <RepoTags names={a.repoMatches} />
              </a>
            ))
          )}
        </div>
      )}

      {/* HN tab */}
      {tab === 'hn' && (
        <div className="space-y-1">
          {hnPosts.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-zinc-600 py-8 text-center">
              No Hacker News posts found.
            </p>
          ) : (
            hnPosts.map((h, i) => (
              <div key={i} className="flex flex-col gap-0.5 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900/60 transition-colors group">
                <div className="flex items-start justify-between gap-3">
                  <a
                    href={h.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug line-clamp-2"
                  >
                    {h.title}
                  </a>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-gray-300 dark:text-zinc-700 mt-0.5">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-zinc-600">
                  <span className="flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-orange-400">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    {h.points} pts
                  </span>
                  <a href={h.hnUrl} target="_blank" rel="noopener noreferrer"
                    className="hover:text-emerald-500 transition-colors">
                    {h.numComments} comments
                  </a>
                  {h.publishedAt && <span>· {timeAgo(h.publishedAt)}</span>}
                </div>
                <RepoTags names={h.repoMatches} />
              </div>
            ))
          )}
        </div>
      )}

      {/* Twitter tab */}
      {tab === 'twitter' && (
        <div className="space-y-1">
          {tweets.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-400 dark:text-zinc-600 mb-2">
                Twitter / X posts couldn&apos;t be fetched automatically.
              </p>
              <p className="text-xs text-gray-400 dark:text-zinc-600">
                The X API requires a paid plan. Visit{' '}
                <a href="https://x.com/trailofbits" target="_blank" rel="noopener noreferrer"
                  className="text-emerald-500 hover:underline">
                  @trailofbits
                </a>{' '}
                directly to see the latest posts.
              </p>
            </div>
          ) : (
            tweets.map((t, i) => (
              <a
                key={i}
                href={t.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col gap-0.5 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900/60 transition-colors group"
              >
                <p className="text-sm text-gray-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 leading-snug line-clamp-3 transition-colors">
                  {t.text}
                </p>
                {t.publishedAt && (
                  <span className="text-xs text-gray-400 dark:text-zinc-600">
                    {timeAgo(t.publishedAt)}
                  </span>
                )}
                <RepoTags names={t.repoMatches} />
              </a>
            ))
          )}
        </div>
      )}
    </section>
  );
}
