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
      { error: 'ANTHROPIC_API_KEY is not configured.', details: 'Add ANTHROPIC_API_KEY to your Vercel environment variables, then redeploy.' },
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
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: 'Invalid Anthropic API key.', details: 'Check that ANTHROPIC_API_KEY is correct in your Vercel environment variables and redeploy.' },
        { status: 401 },
      );
    }
    if (err instanceof Anthropic.PermissionDeniedError) {
      return NextResponse.json(
        { error: 'Anthropic API permission denied.', details: String(err) },
        { status: 403 },
      );
    }
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: 'Anthropic rate limit hit.', details: 'Too many requests — wait a moment and try again.' },
        { status: 429 },
      );
    }
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `Anthropic API error (${err.status}).`, details: err.message },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: 'Generation failed.', details: String(err) },
      { status: 500 },
    );
  }
}
