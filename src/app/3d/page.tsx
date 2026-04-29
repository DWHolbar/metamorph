import type { Metadata } from 'next';
import Header from '@/components/Header';
import ThreeDPageClient from '@/components/ThreeDPageClient';

export const metadata: Metadata = {
  title: '3D Repo Graph — Metamorph',
  description:
    'Explore all open-source repositories from Trail of Bits, Crytic, and Lifting-Bits in an interactive 3D visualization. Discover hidden gems and trending security tools.',
};

export default function ThreeDPage() {
  return (
    <>
      <Header />

      {/* SEO semantic layer — visually hidden, indexable by crawlers */}
      <section
        aria-label="Repository directory"
        className="absolute w-px h-px overflow-hidden"
        style={{ clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}
      >
        <h1>Metamorph 3D Repository Graph</h1>
        <p>
          An interactive 3D visualization of all public open-source repositories maintained by
          Trail of Bits, Crytic, and Lifting-Bits — security-focused GitHub organizations.
          Repos are clustered by organization and sized by GitHub star count. Hidden Gems are
          high-activity repos with zero blog coverage.
        </p>
        <h2>Trail of Bits (trailofbits)</h2>
        <p>
          Security research and engineering tools including fuzzing, formal verification,
          static analysis, and cryptography tooling.
        </p>
        <h2>Crytic</h2>
        <p>
          Smart contract security tools including Slither, Echidna, Medusa, and Manticore —
          state-of-the-art analyzers for Solidity and EVM bytecode.
        </p>
        <h2>Lifting-Bits</h2>
        <p>
          Binary analysis and lifting infrastructure including remill, anvill, and related
          compiler and decompiler tooling.
        </p>
        <p>
          Use the AI Site Guide to discover repos by topic. Click any node to open the
          repository on GitHub. Use the Content Studio to generate tweets, blog posts, and
          newsletters about any repo.
        </p>
      </section>

      <ThreeDPageClient />
    </>
  );
}
