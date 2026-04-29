'use client';

import { useEffect, useRef, useState } from 'react';
import type { Repo } from '@/lib/types';

interface Message {
  role: 'user' | 'guide';
  text: string;
}

interface SearchResult {
  message: string;
  repoNames: string[];
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her',
  'was', 'one', 'our', 'out', 'has', 'him', 'his', 'how', 'its', 'let',
  'may', 'now', 'see', 'set', 'use', 'via', 'who', 'why', 'yet', 'any',
  'ask', 'did', 'get', 'got', 'had', 'lot', 'new', 'old', 'own', 'put',
  'too', 'two', 'way', 'what', 'when', 'will', 'with', 'that', 'this',
  'from', 'have', 'more', 'been', 'than', 'they', 'some', 'into', 'then',
  'tell', 'about', 'does', 'show', 'find', 'give', 'list', 'most', 'also',
  'like', 'just', 'make', 'know', 'want', 'look', 'good', 'well', 'many',
]);

function searchRepos(query: string, repos: Repo[]): SearchResult {
  const q = query.toLowerCase().trim();
  if (!q) return { message: 'Please enter a question or search term.', repoNames: [] };

  const words = q.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
  if (words.length === 0) {
    return { message: 'Try searching by language, topic, org name, or repo name — e.g. "Python fuzzing tools" or "slither".', repoNames: [] };
  }

  const scored = repos.map(repo => {
    const name = repo.name.toLowerCase();
    const desc = (repo.description ?? '').toLowerCase();
    const lang = (repo.language ?? '').toLowerCase();
    const topics = repo.topics.map(t => t.toLowerCase()).join(' ');
    const org = repo.org.toLowerCase();
    let score = 0;

    for (const word of words) {
      if (name === word) score += 12;
      else if (name.includes(word)) score += 6;
      if (desc.includes(word)) score += 2;
      if (topics.includes(word)) score += 4;
      if (lang === word) score += 5;
      if (org.includes(word)) score += 2;
    }

    // Attribute boosts
    if (/(hidden.?gem|gem|underrated|uncovered)/.test(q) && repo.isHiddenGem) score += 8;
    if (/(new|recent|latest)/.test(q) && repo.isNew) score += 5;
    if (/(popular|starred|star)/.test(q) && repo.stars > 500) score += 3;
    if (/(active|maintained)/.test(q)) {
      const days = (Date.now() - new Date(repo.pushedAt).getTime()) / 86400000;
      if (days < 30) score += 4;
    }

    return { repo, score };
  }).filter(r => r.score > 0).sort((a, b) => b.score - a.score).slice(0, 8);

  if (scored.length === 0) {
    return {
      message: `No repos found for "${query}". Try a language name (Python, Rust), a topic (fuzzing, EVM, smart contracts), or a specific repo name.`,
      repoNames: [],
    };
  }

  const repoNames = scored.map(s => s.repo.name);

  // Single repo — give a detailed answer
  if (scored.length === 1 || (scored[0].score > scored[1]?.score * 2)) {
    const r = scored[0].repo;
    const parts: string[] = [];
    parts.push(`${r.name} (${r.org})`);
    if (r.description) parts.push(r.description + '.');
    if (r.language) parts.push(`Written in ${r.language}.`);
    if (r.stars > 0) parts.push(`${r.stars.toLocaleString()} GitHub stars.`);
    if (r.isHiddenGem) parts.push('Flagged as a Hidden Gem — high activity with low blog coverage.');
    if (r.isNew) parts.push('Recently created (last 30 days).');
    return { message: parts.join(' '), repoNames: [r.name] };
  }

  // Multiple results
  const topNames = repoNames.slice(0, 5).join(', ');
  const extra = repoNames.length > 5 ? ` and ${repoNames.length - 5} more` : '';
  return {
    message: `Found ${repoNames.length} repos matching "${query}": ${topNames}${extra}. Highlighted in the table below.`,
    repoNames,
  };
}

export default function SiteGuide({ repos }: { repos: Repo[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([{
    role: 'guide',
    text: 'Hi! Ask me anything about the repos — e.g. "Show me Ethereum tools" or "What\'s the most active Python project?"',
  }]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function send() {
    const q = query.trim();
    if (!q || loading) return;
    setQuery('');
    setMessages(m => [...m, { role: 'user', text: q }]);
    setLoading(true);

    // Small delay so the user message renders first
    setTimeout(() => {
      const result = searchRepos(q, repos);
      setMessages(m => [...m, { role: 'guide', text: result.message }]);
      if (result.repoNames.length > 0) {
        window.dispatchEvent(new CustomEvent('metamorph-guide-action', {
          detail: { repoNames: result.repoNames, action: 'highlight' },
        }));
      }
      setLoading(false);
    }, 300);
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-80 sm:w-96 rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/80">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-semibold text-gray-800 dark:text-zinc-200 flex-1">Site Guide</span>
            <span className="text-xs text-gray-400 dark:text-zinc-600">powered by Claude</span>
          </div>

          <div className="flex-1 max-h-72 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-zinc-200'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-600 text-sm flex items-center gap-1.5">
                  <span className="animate-bounce">·</span>
                  <span className="animate-bounce [animation-delay:100ms]">·</span>
                  <span className="animate-bounce [animation-delay:200ms]">·</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="px-3 py-3 border-t border-gray-100 dark:border-zinc-800 flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask about any repo…"
              disabled={loading}
              className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-50"
            />
            <button
              onClick={send}
              disabled={loading || !query.trim()}
              className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-200 dark:disabled:bg-zinc-700 text-white disabled:text-gray-400 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        title="Site Guide"
        className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all ${
          open ? 'bg-gray-800 dark:bg-zinc-700 text-white rotate-180' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
        }`}
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        )}
      </button>
    </div>
  );
}
