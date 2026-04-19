import type { Repo } from '@/lib/types';
import GemCard from './GemCard';

export default function HiddenGems({ gems }: { gems: Repo[] }) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-2">
          <svg
            className="text-amber-500 dark:text-amber-400"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-100">
            Hidden Gems
          </h2>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-300/50 dark:border-amber-700/40">
          {gems.length} repos
        </span>
        <span className="text-sm text-gray-500 dark:text-zinc-500">
          — high-activity repos with no blog coverage
        </span>
      </div>

      {gems.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 p-12 text-center">
          <p className="text-gray-400 dark:text-zinc-500 text-sm">
            No hidden gems found — blog coverage looks complete!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {gems.map((repo) => (
            <GemCard key={`${repo.org}/${repo.name}`} repo={repo} />
          ))}
        </div>
      )}
    </section>
  );
}
