import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildPrompt } from '@/lib/prompts';
import type { Repo, ContentType } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not configured. Add it to your environment variables.' },
      { status: 500 },
    );
  }

  let repo: Repo, contentType: ContentType;
  try {
    const body = await req.json();
    repo = body.repo;
    contentType = body.contentType;
    if (!repo || !contentType) throw new Error('Missing repo or contentType');
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    const prompt = buildPrompt(repo, contentType);

    const message = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const content =
      message.content[0].type === 'text' ? message.content[0].text : '';

    return NextResponse.json({ content });
  } catch (err) {
    return NextResponse.json(
      { error: 'Generation failed', details: String(err) },
      { status: 500 },
    );
  }
}
