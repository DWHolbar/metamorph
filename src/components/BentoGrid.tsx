'use client';

import { useEffect, useState } from 'react';
import type { Repo, DeltaResult, OrgName } from '@/lib/types';

const ORG_COLORS: Record<OrgName, { bg: string; border: string; badge: string; dot: string }> = {
  trailofbits: {
    bg: 'bg-blue-950/20',
    border: 'border-blue-800/30',
    badge: 'bg-blue-900/40 text-blue-300',
    dot: 'bg-blue-500',
  },
  crytic: {
    bg: 'bg-purple-950/20',
    border: 'border-purple-800/30',
    badge: 'bg-purple-900/40 text-purple-300',
    dot: 'bg-purple-500',
  },
  'lifting-bits': {
    bg: 'bg-orange-950/20',
    border: 'border-orange-800/30',
    badge: 'bg-orange-900/40 text-orange-300',
    dot: 'bg-orange-500',
  },
};

const CACHE_KEY_PREFIX = 'delta-';

export default function BentoGrid() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showGems, setShowGems] = useState(false);

  useEffect(() => {
    const hourKey = `${CACHE_KEY_PREFIX}${new Date().toISOString().slice(0, 13)}`;
    try {
      const raw = localStorage.getItem(hourKey);
      if (raw) {
        const d = JSON.parse(raw) as DeltaResult;
        if (Array.isArray(d.repos)) { setRepos(d.repos); setLoading(false); return; }
      }
    } catch {}
    fetch('/api/delta')
      .then((r) => r.json())
      .then((d: DeltaResult) => { if (Array.isArray(d.repos)) setRepos(d.repos); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const orgs: OrgName[] = ['trailofbits', 'crytic', 'lifting-bits'];

  const filtered = repos.filter((r) => {
    if (showGems && !r.isHiddenGem) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase()) &&
        !(r.description ?? '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-gray-950 text-gray-400 text-sm">
        Loading repos…
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] bg-gray-950 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search repos…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg bg-gray-800 border border-gray-700 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
          <button
            onClick={() => setShowGems((v) => !v)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              showGems
                ? 'border-amber-500 bg-amber-900/30 text-amber-400'
                : 'border-gray-700 bg-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            ★ Hidden Gems only
          </button>
          <span className="text-xs text-gray-600 font-mono">{filtered.length} repos</span>
        </div>

        {/* Org columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {orgs.map((org) => {
            const orgRepos = filtered.filter((r) => r.org === org)
              .sort((a, b) => b.stars - a.stars);
            const cfg = ORG_COLORS[org];

            return (
              <section key={org}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                  <h2 className="font-mono font-semibold text-gray-200 text-sm">{org}</h2>
                  <span className="text-xs text-gray-600 ml-auto">{orgRepos.length}</span>
                </div>

                <div className="space-y-2">
                  {orgRepos.map((repo) => (
                    <a
                      key={`${repo.org}/${repo.name}`}
                      href={repo.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`block rounded-xl border p-3 transition-all hover:scale-[1.01] hover:shadow-lg ${cfg.bg} ${cfg.border} hover:border-opacity-60`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {repo.isHiddenGem && (
                            <svg className="text-amber-400 shrink-0" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                          )}
                          <span className="font-mono text-sm font-semibold text-gray-100 truncate">{repo.name}</span>
                          {repo.isNew && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/50 text-emerald-400 border border-emerald-800/50 shrink-0">New</span>
                          )}
                        </div>
                        <span className="text-xs text-amber-400 font-mono shrink-0">★ {repo.stars.toLocaleString()}</span>
                      </div>

                      {repo.description && (
                        <p className="text-xs text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">{repo.description}</p>
                      )}

                      <div className="flex items-center gap-2 mt-2">
                        {repo.language && (
                          <span className="text-[10px] text-gray-500 font-mono">{repo.language}</span>
                        )}
                        {repo.topics.slice(0, 2).map((t) => (
                          <span key={t} className={`text-[10px] px-1.5 py-0.5 rounded ${cfg.badge}`}>{t}</span>
                        ))}
                        <a
                          href={`/content-studio?repo=${encodeURIComponent(repo.name)}&org=${encodeURIComponent(repo.org)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="ml-auto text-[10px] text-gray-600 hover:text-blue-400 transition-colors"
                        >
                          Generate →
                        </a>
                      </div>
                    </a>
                  ))}

                  {orgRepos.length === 0 && (
                    <p className="text-xs text-gray-600 py-4 text-center">No repos match</p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
