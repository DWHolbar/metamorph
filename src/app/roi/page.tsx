import type { Metadata } from 'next';
import Header from '@/components/Header';
import ROICalculator from '@/components/ROICalculator';

export const metadata: Metadata = {
  title: 'ROI Calculator — Metamorph',
  description: 'Calculate how much time and money your team saves by using Metamorph to monitor open-source repos instead of manually browsing GitHub.',
};

export default function ROIPage() {
  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-zinc-100 mb-3">
            ROI Calculator
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 max-w-xl mx-auto">
            How much engineering time does your team spend manually monitoring GitHub repos?
            Adjust the sliders to see what Metamorph saves you.
          </p>
        </div>
        <ROICalculator />
        <div className="mt-12 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 p-6 text-center">
          <p className="text-sm text-gray-600 dark:text-zinc-400 mb-4">
            Ready to stop manually tracking repos? Metamorph is free — no signup required.
          </p>
          <div className="flex items-center justify-center gap-3">
            <a
              href="/"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
            >
              Open Dashboard
            </a>
            <a
              href="/3d"
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-sm transition-colors"
            >
              Explore 3D Graph
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
