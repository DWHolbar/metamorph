'use client';

import { useState } from 'react';
import type { BlogPost, Repo } from '@/lib/types';

export default function BlogCoverage({
  sources,
  repos,
}: {
  sources: BlogPost[];
  repos: Repo[];
}) {
  const [open, setOpen] = useState(false);

  const covered = repos.filter((r) => r.blogMentions.length > 0);
  const orgBreakdown = ['trailofbits', 'crytic', 'lifting-bits'].map((org) => {
    const orgRepos = repos.filter((r) => r.org === org);
    const orgCovered = orgRepos.filter((r) => r.blogMentions.length > 0);
    return {
      org,
      total: orgRepos.length,
      covered: orgCovered.length,
      pct: Math.round((orgCovered.length / Math.max(1, orgRepos.length)) * 100),
    };
  });

  const ORG_BAR: Record<string, string> = {
    trailofbits: 'bg-blue-500',
    crytic: 'bg-purple-500',
    'lifting-bits': 'bg-orange-500',
  };

  return (
    <section>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-3 mb-5 group w-full text-left"
      >
        <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-100">
          Blog Coverage
        </h2>
        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400">
          {sources.length} posts scraped
        </span>
        <svg
          className={`ml-auto text-gray-400 dark:text-zinc-600 transition-transform ${open ? 'rotate-180' : ''}`}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Always-visible: per-org breakdown bars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        {orgBreakdown.map(({ org, total, covered: cov, pct }) => (
          <div
            key={org}
            className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">
                {org}
              </span>
              <span className="text-xs font-mono text-gray-700 dark:text-zinc-300">
                {cov}/{total}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className={`h-full rounded-full ${ORG_BAR[org]} transition-all`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 dark:text-zinc-600 mt-1">{pct}% covered</p>
          </div>
        ))}
      </div>

      {/* Collapsible blog post list */}
      {open && (
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-gray-100 dark:divide-zinc-800 max-h-96 overflow-y-auto">
          {sources.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-400 dark:text-zinc-600">
              No blog posts scraped — check network access to blog.trailofbits.com
            </p>
          ) : (
            sources.map((post, i) => (
              <a
                key={i}
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors group"
              >
                <svg
                  className="mt-0.5 shrink-0 text-gray-300 dark:text-zinc-700 group-hover:text-emerald-500 transition-colors"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span className="text-sm text-gray-700 dark:text-zinc-300 group-hover:text-gray-900 dark:group-hover:text-zinc-100 transition-colors line-clamp-1">
                  {post.title}
                </span>
              </a>
            ))
          )}
        </div>
      )}
    </section>
  );
}
