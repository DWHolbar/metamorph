'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import BentoGrid from './BentoGrid';

const RepoGraph3D = dynamic(() => import('./RepoGraph3D'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-gray-950 text-gray-500 text-sm">
      Loading 3D scene…
    </div>
  ),
});

const MODE_KEY = 'metamorph-3d-mode';

export default function ThreeDPageClient() {
  const [mode, setMode] = useState<'3d' | 'bento'>('3d');
  const [showInsights, setShowInsights] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(MODE_KEY);
      if (saved === 'bento') setMode('bento');
    } catch {}
  }, []);

  function toggleMode() {
    const next = mode === '3d' ? 'bento' : '3d';
    setMode(next);
    try { localStorage.setItem(MODE_KEY, next); } catch {}
  }

  return (
    <div className="relative">
      {/* Mode + Insights toggle bar */}
      <div className="absolute top-3 right-3 z-50 flex items-center gap-2">
        {mode === '3d' && (
          <button
            onClick={() => setShowInsights((v) => !v)}
            title="Performance Insights"
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              showInsights
                ? 'border-yellow-500 bg-yellow-900/40 text-yellow-300'
                : 'border-gray-700 bg-gray-800/80 text-gray-400 hover:text-gray-200'
            }`}
          >
            ⚡ Insights
          </button>
        )}
        <button
          onClick={toggleMode}
          title={mode === '3d' ? 'Switch to Executive Grid' : 'Switch to 3D View'}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-800/80 text-gray-400 hover:text-gray-200 hover:border-gray-600 transition-colors"
        >
          {mode === '3d' ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
              </svg>
              Executive Grid
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/><path d="M12 2a10 10 0 0 1 10 10"/>
                <path d="M12 2a10 10 0 0 0-10 10"/>
              </svg>
              3D View
            </>
          )}
        </button>
      </div>

      {mode === '3d' ? (
        <RepoGraph3D
          showInsights={showInsights}
          onInsightsDismiss={() => setShowInsights(false)}
        />
      ) : (
        <BentoGrid />
      )}
    </div>
  );
}
