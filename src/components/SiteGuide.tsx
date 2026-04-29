'use client';

import { useEffect, useRef, useState } from 'react';
import type { Repo } from '@/lib/types';

interface Message {
  role: 'user' | 'guide';
  text: string;
}

interface GuideAction {
  repoNames: string[];
  action: 'highlight' | 'info';
}

export default function SiteGuide({ repos }: { repos: Repo[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'guide',
      text: 'Hi! Ask me anything about the repos — e.g. "Show me Ethereum tools" or "What\'s the most active Python project?"',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    const q = query.trim();
    if (!q || loading) return;
    setQuery('');
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setLoading(true);

    try {
      const res = await fetch('/api/guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, repos }),
      });
      const data = await res.json() as { message?: string; repoNames?: string[]; action?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Guide request failed');

      setMessages((m) => [...m, { role: 'guide', text: data.message ?? '...' }]);

      if (data.repoNames && data.repoNames.length > 0) {
        window.dispatchEvent(
          new CustomEvent<GuideAction>('metamorph-guide-action', {
            detail: {
              repoNames: data.repoNames as string[],
              action: (data.action ?? 'highlight') as GuideAction['action'],
            },
          }),
        );
      }
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: 'guide', text: `Sorry, something went wrong: ${err instanceof Error ? err.message : String(err)}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat panel */}
      {open && (
        <div className="w-80 sm:w-96 rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/80">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-semibold text-gray-800 dark:text-zinc-200 flex-1">Site Guide</span>
            <span className="text-xs text-gray-400 dark:text-zinc-600">powered by Claude</span>
          </div>

          {/* Messages */}
          <div className="flex-1 max-h-72 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-zinc-200'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-600 text-sm flex items-center gap-1.5">
                  <span className="animate-bounce delay-0">·</span>
                  <span className="animate-bounce delay-100">·</span>
                  <span className="animate-bounce delay-200">·</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-gray-100 dark:border-zinc-800 flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
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

      {/* Bubble button */}
      <button
        onClick={() => setOpen((o) => !o)}
        title="AI Site Guide"
        className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all ${
          open
            ? 'bg-gray-800 dark:bg-zinc-700 text-white rotate-180'
            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
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
