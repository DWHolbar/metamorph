'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import ThemeToggle from './ThemeToggle';
import NotificationCenter from './NotificationCenter';

interface HeaderProps {
  lastUpdated?: string;
}

const PRIMARY_LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/content-studio', label: 'Content Studio' },
];

const MORE_LINKS = [
  { href: '/roi', label: 'ROI Calculator', desc: 'Calculate time saved' },
  { href: '/templates', label: 'Templates', desc: 'All 10 content types' },
  { href: '/showcase', label: 'Showcase', desc: 'Three.js code snippets' },
  { href: '/about', label: 'Blueprint', desc: 'How Metamorph works' },
];

export default function Header({ lastUpdated }: HeaderProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setMoreOpen(false); }, [pathname]);

  const isMoreActive = MORE_LINKS.some((l) => pathname === l.href);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-base font-bold text-gray-900 dark:text-zinc-100 leading-none tracking-tight">
                Metamorph
              </h1>
              <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">
                Trail of Bits repo intelligence
              </p>
            </div>
          </div>

          <nav className="hidden sm:flex items-center gap-1">
            {PRIMARY_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100'
                    : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:bg-gray-50 dark:hover:bg-zinc-900'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* More dropdown */}
            <div ref={moreRef} className="relative">
              <button
                onClick={() => setMoreOpen((o) => !o)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isMoreActive || moreOpen
                    ? 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100'
                    : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:bg-gray-50 dark:hover:bg-zinc-900'
                }`}
              >
                More
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`transition-transform ${moreOpen ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {moreOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-52 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg overflow-hidden z-50">
                  {MORE_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex flex-col px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors ${
                        pathname === link.href ? 'bg-gray-50 dark:bg-zinc-800' : ''
                      }`}
                    >
                      <span className={`text-sm font-medium ${
                        pathname === link.href
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-gray-800 dark:text-zinc-200'
                      }`}>
                        {link.label}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-zinc-600 mt-0.5">{link.desc}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="hidden sm:block text-xs text-gray-400 dark:text-zinc-600 font-mono">
              {new Date(lastUpdated).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
          <NotificationCenter />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
