'use client';

import { useState, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { Repo, OrgName } from '@/lib/types';

type SortField = 'name' | 'stars' | 'pushedAt' | 'activityScore';
type SortDir = 'asc' | 'desc';

const ORG_DOT: Record<OrgName, string> = {
  trailofbits: 'bg-blue-500',
  crytic: 'bg-purple-500',
  'lifting-bits': 'bg-orange-500',
};

const ALL_ORGS: OrgName[] = ['trailofbits', 'crytic', 'lifting-bits'];

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className={`ml-1 transition-opacity ${active ? 'opacity-100' : 'opacity-20'}`}
    >
      {dir === 'asc' || !active ? (
        <polyline points="18 15 12 9 6 15" />
      ) : (
        <polyline points="6 9 12 15 18 9" />
      )}
    </svg>
  );
}

export default function RepoTable({ repos }: { repos: Repo[] }) {
  const [search, setSearch] = useState('');
  const [orgs, setOrgs] = useState<OrgName[]>([...ALL_ORGS]);
  const [sortField, setSortField] = useState<SortField>('activityScore');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [showOnlyGems, setShowOnlyGems] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  function toggleOrg(org: OrgName) {
    setOrgs((prev) =>
      prev.includes(org) ? prev.filter((o) => o !== org) : [...prev, org],
    );
    setPage(1);
  }

  function handleSort(field: SortField) {
    if (field === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setPage(1);
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return repos.filter((r) => {
      if (orgs.length > 0 && !orgs.includes(r.org)) return false;
      if (showOnlyGems && !r.isHiddenGem) return false;
      if (q && !r.name.toLowerCase().includes(q) && !r.description?.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [repos, search, orgs, showOnlyGems]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'stars') cmp = a.stars - b.stars;
      else if (sortField === 'pushedAt')
        cmp = new Date(a.pushedAt).getTime() - new Date(b.pushedAt).getTime();
      else cmp = a.activityScore - b.activityScore;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function colHeader(label: string, field: SortField) {
    return (
      <button
        onClick={() => handleSort(field)}
        className="flex items-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-zinc-200 transition-colors"
      >
        {label}
        <SortIcon active={sortField === field} dir={sortDir} />
      </button>
    );
  }

  return (
    <section>
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-100">
          All Repositories
        </h2>
        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400">
          {filtered.length}
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search repos..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>

        <div className="flex items-center gap-2">
          {ALL_ORGS.map((org) => (
            <button
              key={org}
              onClick={() => toggleOrg(org)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                orgs.includes(org)
                  ? 'border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-200'
                  : 'border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 text-gray-400 dark:text-zinc-600'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${ORG_DOT[org]}`} />
              <span className="hidden lg:inline">{org}</span>
              <span className="lg:hidden">{org.split('-')[0]}</span>
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400 cursor-pointer ml-auto">
          <input
            type="checkbox"
            checked={showOnlyGems}
            onChange={(e) => { setShowOnlyGems(e.target.checked); setPage(1); }}
            className="rounded border-gray-300 dark:border-zinc-600 accent-amber-500"
          />
          Gems only
        </label>
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
                <th className="text-left px-4 py-3 hidden md:table-cell">
                  {colHeader('Last Push', 'pushedAt')}
                </th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Language</th>
                <th className="text-center px-4 py-3 hidden md:table-cell">Coverage</th>
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
                  <tr
                    key={`${repo.org}/${repo.name}`}
                    className={`transition-colors ${
                      repo.isHiddenGem
                        ? 'bg-amber-50/40 dark:bg-amber-950/10 hover:bg-amber-50 dark:hover:bg-amber-950/20'
                        : repo.blogMentions.length > 0
                          ? 'bg-emerald-50/30 dark:bg-emerald-950/10 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20'
                          : 'bg-white dark:bg-zinc-950 hover:bg-gray-50 dark:hover:bg-zinc-900/60'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {repo.isHiddenGem && (
                          <span title="Hidden gem" className="text-amber-400 shrink-0">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          </span>
                        )}
                        <a
                          href={repo.htmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono font-medium text-gray-900 dark:text-zinc-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        >
                          {repo.name}
                        </a>
                        {repo.isNew && (
                          <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                            New
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`inline-flex items-center gap-1.5 text-xs`}>
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
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/50">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-600 dark:text-emerald-400">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 dark:bg-zinc-800">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-300 dark:text-zinc-600">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900">
            <span className="text-xs text-gray-400 dark:text-zinc-600">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-2 py-1 text-xs rounded border border-gray-200 dark:border-zinc-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Prev
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-2 py-1 text-xs rounded border border-gray-200 dark:border-zinc-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
