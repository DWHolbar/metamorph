'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
  lastUpdated?: string;
}

export default function Header({ lastUpdated }: HeaderProps) {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Dashboard' },
    { href: '/content-studio', label: 'Content Studio' },
  ];

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
            {navLinks.map((link) => (
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
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
