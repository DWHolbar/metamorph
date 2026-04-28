import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: '3D Repo Graph — Metamorph',
};

// Load RepoGraph3D client-side only (Three.js requires browser APIs)
const RepoGraph3D = dynamic(() => import('@/components/RepoGraph3D'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-gray-950 text-gray-500 text-sm">
      Loading 3D scene…
    </div>
  ),
});

export default function ThreeDPage() {
  return (
    <>
      <Header />
      <div className="h-[calc(100vh-64px)]">
        <RepoGraph3D />
      </div>
    </>
  );
}
