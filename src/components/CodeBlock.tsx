'use client';

import { useState } from 'react';

interface CodeBlockProps {
  title: string;
  language?: string;
  code: string;
}

export default function CodeBlock({ title, language = 'typescript', code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-100 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-500 dark:text-zinc-500">{language}</span>
          <span className="text-xs text-gray-700 dark:text-zinc-300 font-medium">{title}</span>
        </div>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md transition-all ${
            copied
              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
              : 'bg-white dark:bg-zinc-700 text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 border border-gray-200 dark:border-zinc-600'
          }`}
        >
          {copied ? (
            <>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs text-gray-800 dark:text-zinc-200 bg-white dark:bg-zinc-900 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}
