export default function RateLimitBanner() {
  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 flex items-start gap-3">
      <svg
        className="mt-0.5 shrink-0 text-amber-400"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <div>
        <p className="text-sm font-medium text-amber-300">
          No GitHub token detected — using unauthenticated API (60 req/hr limit)
        </p>
        <p className="text-xs text-amber-400/70 mt-0.5">
          Results may be incomplete. Add{' '}
          <code className="font-mono bg-amber-500/20 px-1 rounded">GITHUB_TOKEN</code>{' '}
          to your environment for full coverage.
        </p>
      </div>
    </div>
  );
}
