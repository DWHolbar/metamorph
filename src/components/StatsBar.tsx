interface StatsBarProps {
  stats: {
    totalRepos: number;
    hiddenGemsCount: number;
    coveredCount: number;
    coveragePercent: number;
  };
}

function StatCard({
  label,
  value,
  sub,
  accent,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 flex items-start gap-4">
      <div
        className={`mt-0.5 p-2 rounded-xl ${accent ?? 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400'}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100 font-mono">
          {value}
        </p>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">{label}</p>
        {sub && (
          <p className="text-xs text-gray-400 dark:text-zinc-600 mt-1">{sub}</p>
        )}
      </div>
    </div>
  );
}

export default function StatsBar({ stats }: StatsBarProps) {
  const coverageColor =
    stats.coveragePercent >= 60
      ? 'text-emerald-600 dark:text-emerald-400'
      : stats.coveragePercent >= 30
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-red-600 dark:text-red-400';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Repos Analyzed"
        value={stats.totalRepos}
        sub="across 3 orgs"
        accent="bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400"
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
        }
      />
      <StatCard
        label="Hidden Gems"
        value={stats.hiddenGemsCount}
        sub="active, un-blogged repos"
        accent="bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400"
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        }
      />
      <StatCard
        label="Blog Coverage"
        value={`${stats.coveragePercent}%`}
        sub={`${stats.coveredCount} repos mentioned`}
        accent={`${coverageColor} bg-emerald-100 dark:bg-emerald-950/50`}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        }
      />
      <StatCard
        label="Orgs Scanned"
        value="3"
        sub="trailofbits · crytic · lifting-bits"
        accent="bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400"
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        }
      />
    </div>
  );
}
