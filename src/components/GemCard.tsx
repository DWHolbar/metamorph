import { formatDistanceToNow } from 'date-fns';
import type { OrgName, Repo } from '@/lib/types';

const ORG_COLORS: Record<OrgName, string> = {
  trailofbits: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400',
  crytic: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400',
  'lifting-bits': 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400',
};

function relativeDate(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return iso.slice(0, 10);
  }
}

export default function GemCard({ repo }: { repo: Repo }) {
  const daysSincePush = Math.floor(
    (Date.now() - new Date(repo.pushedAt).getTime()) / 86_400_000,
  );
  const isRecent = daysSincePush <= 7;

  return (
    <a
      href={repo.htmlUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-2xl border border-amber-300/30 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/10 hover:border-amber-400/60 dark:hover:border-amber-500/40 hover:bg-amber-50 dark:hover:bg-amber-950/20 p-5 transition-all"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ORG_COLORS[repo.org]}`}>
            {repo.org}
          </span>
          {repo.isNew && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300/50 dark:border-emerald-700/40">
              New
            </span>
          )}
          {isRecent && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Active
            </span>
          )}
        </div>

        {/* Stars with tooltip */}
        <div className="group/stars relative flex items-center gap-1 text-amber-500 dark:text-amber-400 shrink-0">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span className="text-sm font-mono font-semibold">{repo.stars.toLocaleString()}</span>
          <div className="absolute bottom-full right-0 mb-2 w-56 hidden group-hover/stars:block z-10 pointer-events-none">
            <div className="bg-gray-900 dark:bg-zinc-700 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
              <p className="font-semibold mb-0.5">GitHub Stars: {repo.stars.toLocaleString()}</p>
              <p className="text-gray-300 dark:text-zinc-300 leading-snug">
                The number of GitHub users who have starred (bookmarked) this repo — a signal of community interest and adoption.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Repo name */}
      <h3 className="font-mono font-bold text-gray-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors text-base mb-1 flex items-center gap-1.5">
        {repo.name}
        <svg
          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </h3>

      {/* Description */}
      {repo.description && (
        <p className="text-sm text-gray-500 dark:text-zinc-400 line-clamp-2 mb-3">
          {repo.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-3 flex-wrap mt-auto">
        {repo.language && (
          <span className="text-xs text-gray-500 dark:text-zinc-500 font-mono">
            {repo.language}
          </span>
        )}
        <span className="text-xs text-gray-400 dark:text-zinc-600">
          Pushed {relativeDate(repo.pushedAt)}
        </span>
        {repo.topics.slice(0, 2).map((t) => (
          <span
            key={t}
            className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-500"
          >
            {t}
          </span>
        ))}
      </div>
    </a>
  );
}
