'use client';

import { useEffect, useState, useRef } from 'react';
import type { Repo, DeltaResult, ContentType } from '@/lib/types';
import { CONTENT_TYPE_LABELS } from '@/lib/types';
import Header from './Header';

const CONTENT_TYPES = Object.entries(CONTENT_TYPE_LABELS) as [ContentType, string][];

const CACHE_KEY = `delta-${new Date().toISOString().slice(0, 13)}`;

const TYPE_ICONS: Record<ContentType, string> = {
  'tweet-short': '𝕏',
  'tweet-thread': '🧵',
  linkedin: 'in',
  'blog-outline': '📋',
  'blog-full': '📝',
  newsletter: '📧',
  'pr-pitch': '📰',
  'technical-faq': '❓',
  'testing-guide': '🧪',
  'tool-review': '🔍',
};

export default function ContentStudio() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
  const [contentType, setContentType] = useState<ContentType>('tweet-short');
  const [generated, setGenerated] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'gems'>('gems');
  const outputRef = useRef<HTMLTextAreaElement>(null);

  // Load repos from cache or API
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as DeltaResult;
        setRepos(data.repos);
        setLoadingRepos(false);
        return;
      }
    } catch {}

    fetch('/api/delta')
      .then((r) => r.json())
      .then((data: DeltaResult) => {
        setRepos(data.repos);
        setLoadingRepos(false);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {}
      })
      .catch(() => setLoadingRepos(false));
  }, []);

  const filteredRepos = repos
    .filter((r) => {
      if (filter === 'gems' && !r.isHiddenGem) return false;
      if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .slice(0, 80);

  async function generate() {
    if (!selectedRepo) return;
    setGenerating(true);
    setGenError(null);
    setGenerated('');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo: selectedRepo, contentType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error || 'Unknown error');
      setGenerated(data.content);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : String(err));
    } finally {
      setGenerating(false);
    }
  }

  async function copyToClipboard() {
    if (!generated) return;
    await navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page heading */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-zinc-100 mb-2">
            Content Studio
          </h2>
          <p className="text-gray-500 dark:text-zinc-400 max-w-2xl">
            Select any repo — especially Hidden Gems — and instantly generate tweets,
            blog posts, newsletters, PR pitches, and more using AI.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
          {/* LEFT: Repo selector */}
          <aside className="flex flex-col gap-4">
            <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-zinc-800 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
                  Select a Repository
                </h3>

                {/* Search */}
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search repos..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                {/* Filter */}
                <div className="flex gap-1">
                  {(['gems', 'all'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`flex-1 py-1 text-xs font-medium rounded-lg transition-colors ${
                        filter === f
                          ? 'bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                          : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {f === 'gems' ? 'Hidden Gems' : 'All Repos'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Repo list */}
              <div className="overflow-y-auto max-h-[480px] divide-y divide-gray-50 dark:divide-zinc-800/60">
                {loadingRepos ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-400 dark:text-zinc-600">
                    Loading repos…
                  </div>
                ) : filteredRepos.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-400 dark:text-zinc-600">
                    No repos found
                  </div>
                ) : (
                  filteredRepos.map((repo) => (
                    <button
                      key={`${repo.org}/${repo.name}`}
                      onClick={() => { setSelectedRepo(repo); setGenerated(''); setGenError(null); }}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors ${
                        selectedRepo?.name === repo.name && selectedRepo?.org === repo.org
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 border-l-2 border-emerald-500'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {repo.isHiddenGem && (
                            <svg className="text-amber-400 shrink-0" width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                          )}
                          <span className="font-mono text-sm text-gray-900 dark:text-zinc-100 truncate">
                            {repo.name}
                          </span>
                          {repo.isNew && (
                            <span className="text-xs px-1 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shrink-0">
                              New
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400 shrink-0 text-xs font-mono">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                          </svg>
                          {repo.stars.toLocaleString()}
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-zinc-600 mt-0.5 truncate">
                        {repo.org} {repo.language ? `· ${repo.language}` : ''}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </aside>

          {/* RIGHT: Content generator */}
          <div className="flex flex-col gap-4">
            {/* Selected repo info */}
            {selectedRepo ? (
              <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-gray-900 dark:text-zinc-100">
                      {selectedRepo.name}
                    </span>
                    {selectedRepo.isHiddenGem && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400">
                        Hidden Gem
                      </span>
                    )}
                    {selectedRepo.isNew && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">
                        New
                      </span>
                    )}
                  </div>
                  {selectedRepo.description && (
                    <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1 line-clamp-2">
                      {selectedRepo.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 dark:text-zinc-600">
                    <span className="flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                      {selectedRepo.stars.toLocaleString()} GitHub stars
                    </span>
                    {selectedRepo.language && <span>{selectedRepo.language}</span>}
                    <span>{selectedRepo.org}</span>
                  </div>
                </div>
                <a
                  href={selectedRepo.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-xs text-gray-400 dark:text-zinc-600 hover:text-emerald-500 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-900/30 p-8 text-center">
                <p className="text-gray-400 dark:text-zinc-600 text-sm">
                  Select a repository from the left to get started
                </p>
              </div>
            )}

            {/* Content type selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CONTENT_TYPES.map(([type, label]) => (
                <button
                  key={type}
                  onClick={() => { setContentType(type); setGenerated(''); setGenError(null); }}
                  className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-xs font-medium transition-all ${
                    contentType === type
                      ? 'border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                      : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <span className="text-base leading-none">{TYPE_ICONS[type]}</span>
                  <span className="text-center leading-snug">{label}</span>
                </button>
              ))}
            </div>

            {/* Generate button */}
            <button
              onClick={generate}
              disabled={!selectedRepo || generating}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-200 dark:disabled:bg-zinc-800 text-white disabled:text-gray-400 dark:disabled:text-zinc-600 font-semibold text-sm transition-colors"
            >
              {generating ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Generating with Claude…
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                  Generate {CONTENT_TYPE_LABELS[contentType]}
                </>
              )}
            </button>

            {/* Error */}
            {genError && (
              <div className="rounded-xl border border-red-300/40 dark:border-red-500/30 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                {genError}
              </div>
            )}

            {/* Output */}
            {generated && (
              <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
                  <span className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
                    {CONTENT_TYPE_LABELS[contentType]} — {selectedRepo?.name}
                  </span>
                  <button
                    onClick={copyToClipboard}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      copied
                        ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                        : 'border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400'
                    }`}
                  >
                    {copied ? (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  ref={outputRef}
                  readOnly
                  value={generated}
                  rows={Math.min(30, generated.split('\n').length + 4)}
                  className="w-full px-4 py-4 text-sm text-gray-800 dark:text-zinc-200 bg-transparent font-mono resize-none focus:outline-none leading-relaxed"
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
