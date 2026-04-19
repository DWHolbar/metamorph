'use client';

import { useState, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { Repo, OrgName } from '@/lib/types';

type SortField = 'name' | 'stars' | 'pushedAt' | 'activityScore';
type SortDir = 'asc' | 'desc';
type ViewTab = 'all' | 'gems' | 'new' | 'active' | 'covered';

const ORG_DOT: Record<OrgName, string> = {
  trailofbits: 'bg-blue-500',
  crytic: 'bg-purple-500',
  'lifting-bits': 'bg-orange-500',
};

const ORG_ACTIVE: Record<OrgName, string> = {
  trailofbits: 'border-blue-400 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300',
  crytic: 'border-purple-400 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300',
  'lifting-bits': 'border-orange-400 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300',
};

const ALL_ORGS: OrgName[] = ['trailofbits', 'crytic', 'lifting-bits'];

const TABS: { id: ViewTab; label: string; filter: (r: Repo) => boolean }[] = [
  { id: 'all',     label: 'All Repos',     filter: () => true },
  { id: 'gems',    label: 'Hidden Gems',   filter: (r) => r.isHiddenGem },
  { id: 'new',     label: 'New (30d)',      filter: (r) => r.isNew },
  { id: 'active',  label: 'Active',        filter: (r) => (Date.now() - new Date(r.pushedAt).getTime()) / 86400000 < 90 },
  { id: 'covered', label: 'Blog Covered',  filter: (r) => r.blogMentions.length > 0 },
];

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      className={`ml-1 transition-opacity ${active ? 'opacity-100' : 'opacity-20'}`}>
      {dir === 'asc' || !active
        ? <polyline points="18 15 12 9 6 15" />
        : <polyline points="6 9 12 15 18 9" />}
    </svg>
  );
}

export default function RepoTable({ repos }: { repos: Repo[] }) {
  const [tab, setTab] = useState<ViewTab>('all');
  const [search, setSearch] = useState('');
  const [activeOrgs, setActiveOrgs] = useState<Set<OrgName>>(new Set(ALL_ORGS));
  const [sortField, setSortField] = useState<SortField>('activityScore');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  const tabFilter = TABS.find((t) => t.id === tab)!.filter;

  const tabCounts = useMemo(() =>
    Object.fromEntries(TABS.map((t) => [t.id, repos.filter(t.filter).length])) as Record<ViewTab, number>,
    [repos],
  );

  function toggleOrg(org: OrgName) {
    setActiveOrgs((prev) => {
      const next = new Set(prev);
      next.has(org) ? next.delete(org) : next.add(org);
      return next;
    });
    setPage(1);
  }

  function handleSort(field: SortField) {
    if (field === sortField) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('desc'); }
    setPage(1);
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return repos.filter((r) => {
      if (!activeOrgs.has(r.org)) return false;
      if (!tabFilter(r)) return false;
      if (q && !r.name.toLowerCase().includes(q) && !r.description?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [repos, search, activeOrgs, tabFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'stars') cmp = a.stars - b.stars;
      else if (sortField === 'pushedAt') cmp = new Date(a.pushedAt).getTime() - new Date(b.pushedAt).getTime();
      else cmp = a.activityScore - b.activityScore;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function colHeader(label: string, field: SortField) {
    return (
      <button onClick={() => handleSort(field)}
        className="flex items-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-zinc-200 transition-colors">
        {label}<SortIcon active={sortField === field} dir={sortDir} />
      </button>
    );
  }

  return (
    <section>
      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => { setTab(t.id); setPage(1); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              tab === t.id
                ? 'bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-200'
            }`}>
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-mono ${
              tab === t.id
                ? 'bg-white/20 dark:bg-black/20 text-white dark:text-zinc-900'
                : 'bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500'
            }`}>
              {tabCounts[t.id]}
            </span>
          </button>
        ))}
      </div>

      {/* Secondary filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500"
            width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" placeholder="Search repos…" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-8 pr-3 py-1.5 text-sm w-44 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>

        {/* Org pills */}
        <div className="flex items-center gap-1.5">
          {ALL_ORGS.map((org) => (
            <button key={org} onClick={() => toggleOrg(org)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                activeOrgs.has(org)
                  ? ORG_ACTIVE[org]
                  : 'border-gray-200 dark:border-zinc-800 text-gray-400 dark:text-zinc-600 hover:border-gray-300 dark:hover:border-zinc-700'
              }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${ORG_DOT[org]}`} />
              {org}
            </button>
          ))}
        </div>

        {/* Result count */}
        <span className="ml-auto text-xs text-gray-400 dark:text-zinc-600 font-mono">
          {filtered.length} repo{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
              <tr>
                <th className="text-left px-4 py-3">{colHeader('Repo', 'name')}</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Org</th>
                <th className="text-right px-4 py-3">
                  <div className="flex items-center justify-end gap-1 group/th relative">
                    {colHeader('Stars', 'stars')}
                    <span className="text-gray-300 dark:text-zinc-600 cursor-help">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                      </svg>
                    </span>
                    <div className="absolute top-full right-0 mt-1 w-52 hidden group-hover/th:block z-10 pointer-events-none">
                      <div className="bg-gray-900 dark:bg-zinc-700 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
                        GitHub Stars — the number of users who have bookmarked this repo. Higher = more community interest &amp; adoption.
                      </div>
                    </div>
                  </div>
                </th>
                <th className="text-left px-4 py-3 hidden md:table-cell">{colHeader('Last Push', 'pushedAt')}</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Language</th>
                <th className="text-center px-4 py-3 hidden md:table-cell">Blog</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400 dark:text-zinc-600 text-sm">
                    No repos match your filters
                  </td>
                </tr>
              ) : (
                paged.map((repo) => (
                  <tr key={`${repo.org}/${repo.name}`}
                    className={`transition-colors ${
                      repo.isHiddenGem
                        ? 'bg-amber-50/40 dark:bg-amber-950/10 hover:bg-amber-50 dark:hover:bg-amber-950/20'
                        : repo.blogMentions.length > 0
                          ? 'bg-emerald-50/30 dark:bg-emerald-950/10 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20'
                          : 'bg-white dark:bg-zinc-950 hover:bg-gray-50 dark:hover:bg-zinc-900/60'
                    }`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {repo.isHiddenGem && (
                          <span title="Hidden gem" className="text-amber-400 shrink-0">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          </span>
                        )}
                        <a href={repo.htmlUrl} target="_blank" rel="noopener noreferrer"
                          className="font-mono font-medium text-gray-900 dark:text-zinc-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                          {repo.name}
                        </a>
                        {repo.isNew && (
                          <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                            New
                          </span>
                        )}
                      </div>
                      {repo.description && (
                        <p className="text-xs text-gray-400 dark:text-zinc-600 mt-0.5 line-clamp-1 max-w-xs">
                          {repo.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${ORG_DOT[repo.org]}`} />
                        <span className="text-gray-500 dark:text-zinc-500">{repo.org}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-600 dark:text-zinc-400 text-xs">
                      {repo.stars.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-400 dark:text-zinc-600">
                      {formatDistanceToNow(new Date(repo.pushedAt), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-400 dark:text-zinc-600 font-mono">
                      {repo.language ?? '—'}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-center">
                      {repo.blogMentions.length > 0 ? (
                        <div className="relative group/blog inline-flex">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 cursor-pointer">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-600 dark:text-emerald-400">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </span>
                          {/* Blog post link tooltip */}
                          <div className="absolute bottom-full right-0 mb-2 hidden group-hover/blog:flex flex-col gap-1 z-20 min-w-max max-w-xs pointer-events-auto">
                            <div className="bg-gray-900 dark:bg-zinc-800 rounded-lg shadow-lg overflow-hidden border border-zinc-700 dark:border-zinc-600">
                              {repo.blogMentions.map((post, pi) => (
                                <a
                                  key={pi}
                                  href={post.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-700 transition-colors border-b border-zinc-700 last:border-0"
                                >
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-emerald-400">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                                  </svg>
                                  <span className="line-clamp-2 leading-snug">{post.title}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 dark:bg-zinc-800">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-300 dark:text-zinc-600">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900">
            <span className="text-xs text-gray-400 dark:text-zinc-600">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
            </span>
            <div className="flex items-center gap-1">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                className="px-2 py-1 text-xs rounded border border-gray-200 dark:border-zinc-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                Prev
              </button>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
                className="px-2 py-1 text-xs rounded border border-gray-200 dark:border-zinc-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
