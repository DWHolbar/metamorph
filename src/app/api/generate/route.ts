import { NextResponse } from 'next/server';
import { generateContent } from '@/lib/prompts';
import type { Repo, ContentType } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let repo: Repo, contentType: ContentType;
  try {
    const body = await req.json();
    repo = body.repo;
    contentType = body.contentType;
    if (!repo || !contentType) throw new Error('Missing repo or contentType');
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const content = generateContent(repo, contentType);
  return NextResponse.json({ content });
}
