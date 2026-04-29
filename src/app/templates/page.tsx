import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import { CONTENT_TYPE_LABELS } from '@/lib/types';
import type { ContentType } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Content Templates — Metamorph',
  description: 'Browse all 10 content templates available in Metamorph Content Studio — tweets, blog posts, newsletters, PR pitches, and more for open-source repos.',
};

const TEMPLATE_META: Record<ContentType, {
  icon: string;
  description: string;
  audience: string;
  example: string;
}> = {
  'tweet-short': {
    icon: '𝕏',
    description: 'A punchy single tweet (≤280 chars) announcing a tool with its key value proposition and a GitHub link.',
    audience: 'Social media followers, developer community',
    example: '🛠️ slither is a static analysis framework for Solidity smart contracts — catches bugs before they hit mainnet. ⭐ 4.2k on GitHub. Check it out: github.com/...',
  },
  'tweet-thread': {
    icon: '🧵',
    description: 'A 4–6 tweet thread doing a deep-dive: what the tool does, why it matters, how to install it, and a call to action.',
    audience: 'Technical Twitter, security community',
    example: '1/ Meet echidna — the fuzzer built specifically for Ethereum smart contracts. Here\'s why it\'s the best tool for finding edge cases in Solidity... 🧵',
  },
  linkedin: {
    icon: 'in',
    description: 'A professional LinkedIn post with a hook, 3–4 structured paragraphs, and a clear CTA. Formatted for the platform\'s algorithm.',
    audience: 'Engineering managers, security professionals, recruiters',
    example: 'Trail of Bits just shipped a major update to manticore — our symbolic execution engine for EVM and native binaries...',
  },
  'blog-outline': {
    icon: '📋',
    description: 'A structured 6–8 section blog outline with H2 headings, bullet point sub-sections, and writing guidance for each section.',
    audience: 'Technical writers, developer advocates',
    example: '## Introduction\n- Hook: the problem with manual smart contract auditing\n- Why automated analysis matters\n\n## What is slither?\n...',
  },
  'blog-full': {
    icon: '📝',
    description: 'A complete 600–900 word technical blog post with introduction, architecture overview, use case walkthrough, and conclusion.',
    audience: 'Blog editors, content teams, developer relations',
    example: 'When Solidity developers ship code to mainnet, there\'s no rollback. Bugs are permanent — and expensive. That\'s why static analysis tools like slither matter...',
  },
  newsletter: {
    icon: '📧',
    description: 'A newsletter blurb (150–200 words) suitable for a developer digest, security roundup, or open-source weekly.',
    audience: 'Newsletter editors, developer community managers',
    example: '**Hidden Gem of the Week: remill**\nTrail of Bits\' binary lifting library translates machine code into LLVM IR — making it the foundation for decompilers, fuzzers, and formal verification tools...',
  },
  'pr-pitch': {
    icon: '📰',
    description: 'A press release pitch email for tech journalists and security media. Includes newsworthiness hook, quotes, and a boilerplate.',
    audience: 'PR teams, communications managers',
    example: 'SUBJECT: Trail of Bits Open-Sources Medusa — Next-Gen Smart Contract Fuzzer\n\nFOR IMMEDIATE RELEASE...',
  },
  'technical-faq': {
    icon: '❓',
    description: 'A 5-question technical FAQ covering what the tool does, how it compares to alternatives, installation, common use cases, and getting support.',
    audience: 'Documentation teams, support channels',
    example: 'Q: What makes echidna different from other fuzzers?\nA: echidna is purpose-built for EVM smart contracts...',
  },
  'testing-guide': {
    icon: '🧪',
    description: 'A step-by-step testing guide generated from the repo\'s actual README — includes real install commands, usage examples, and a test scenario.',
    audience: 'Security engineers, QA teams, developers evaluating the tool',
    example: '## Getting Started with slither\n\n### Installation\n```bash\npip install slither-analyzer\n```\n\n### Running your first analysis...',
  },
  'tool-review': {
    icon: '🔍',
    description: 'A structured tool review covering capabilities, strengths, limitations, and ideal use cases — drawn from the actual README and repo metadata.',
    audience: 'Security practitioners, decision makers, technical evaluators',
    example: '**Tool:** medusa\n**Category:** Smart Contract Fuzzer\n**Verdict:** Best-in-class for complex invariant testing...',
  },
};

export default function TemplatesPage() {
  const entries = Object.entries(TEMPLATE_META) as [ContentType, typeof TEMPLATE_META[ContentType]][];

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-zinc-100 mb-3">
            Content Templates
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 max-w-2xl">
            Metamorph ships with 10 content templates covering the full marketing stack — from social media to press releases.
            Every template is filled with live repo data. Select a repo in Content Studio to generate instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {entries.map(([type, meta]) => (
            <div
              key={type}
              className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-zinc-800">
                <span className="text-xl w-8 text-center">{meta.icon}</span>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-gray-900 dark:text-zinc-100 text-sm">
                    {CONTENT_TYPE_LABELS[type]}
                  </h2>
                  <p className="text-xs text-gray-400 dark:text-zinc-600 mt-0.5 truncate">{meta.audience}</p>
                </div>
                <Link
                  href={`/content-studio`}
                  className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                >
                  Use →
                </Link>
              </div>

              {/* Description */}
              <div className="px-5 py-3 flex-1">
                <p className="text-sm text-gray-500 dark:text-zinc-400">{meta.description}</p>
              </div>

              {/* Example preview */}
              <div className="px-5 pb-5">
                <p className="text-xs text-gray-400 dark:text-zinc-600 mb-1.5 font-medium uppercase tracking-wide">Example output</p>
                <pre className="text-xs text-gray-600 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-800 rounded-xl px-3 py-3 overflow-hidden line-clamp-4 whitespace-pre-wrap leading-relaxed font-mono">
                  {meta.example}
                </pre>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/content-studio"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            Open Content Studio
          </Link>
        </div>
      </main>
    </>
  );
}
