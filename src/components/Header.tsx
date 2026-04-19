import ThemeToggle from './ThemeToggle';

interface HeaderProps {
  lastUpdated?: string;
}

export default function Header({ lastUpdated }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold font-mono text-emerald-500 dark:text-emerald-400 leading-none">
            &Delta;
          </span>
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-zinc-100 leading-none">
              Delta Reporter
            </h1>
            <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">
              Marketing-to-Engineering Coverage Gap
            </p>
          </div>
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
