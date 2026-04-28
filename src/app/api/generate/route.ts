import { NextResponse } from 'next/server';
import { generateContent } from '@/lib/prompts';
import type { Repo, ContentType } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function fetchReadme(org: string, name: string): Promise<string> {
  try {
    const headers: Record<string, string> = { Accept: 'application/vnd.github.v3+json' };
    if (process.env.GITHUB_TOKEN) headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
    const res = await fetch(`https://api.github.com/repos/${org}/${name}/readme`, {
      headers,
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return '';
    const data = await res.json() as { content?: string };
    if (!data.content) return '';
    return Buffer.from(data.content, 'base64').toString('utf-8').slice(0, 5000);
  } catch {
    return '';
  }
}

export async function POST(req: Request) {
  let repo: Repo, contentType: ContentType, variation: number;
  try {
    const body = await req.json() as { repo: Repo; contentType: ContentType; variation?: number };
    repo = body.repo;
    contentType = body.contentType;
    variation = typeof body.variation === 'number' ? body.variation : 0;
    if (!repo || !contentType) throw new Error('Missing repo or contentType');
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // Fetch README for content types that benefit from real repo data
  const needsReadme = contentType === 'testing-guide' || contentType === 'tool-review';
  const readme = needsReadme ? await fetchReadme(repo.org, repo.name) : '';

  try {
    const content = generateContent(repo, contentType, variation, readme);
    return NextResponse.json({ content });
  } catch (err) {
    return NextResponse.json(
      { error: 'Content generation failed', details: String(err) },
      { status: 500 },
    );
  }
}
