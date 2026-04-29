import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { Repo } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface GuideResponse {
  message: string;
  repoNames: string[];
  action: 'highlight' | 'info';
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 });
  }

  let query: string, repos: Repo[];
  try {
    const body = await req.json() as { query: string; repos: Repo[] };
    query = body.query?.trim();
    repos = body.repos ?? [];
    if (!query) throw new Error('Missing query');
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const repoContext = repos.slice(0, 150).map((r) => ({
    name: r.name,
    org: r.org,
    description: r.description,
    topics: r.topics.slice(0, 5),
    stars: r.stars,
    language: r.language,
    isHiddenGem: r.isHiddenGem,
    isNew: r.isNew,
  }));

  const systemPrompt = `You are the AI guide for Metamorph, a dashboard that tracks open-source security repos from Trail of Bits (orgs: trailofbits, crytic, lifting-bits).

Given a user query, identify the most relevant repositories and respond with ONLY valid JSON — no markdown, no explanation outside the JSON:
{
  "message": "A short, helpful reply (1-3 sentences, technical and specific)",
  "repoNames": ["repo-name-1", "repo-name-2"],
  "action": "highlight" | "info"
}

action meanings:
- "highlight": filter/highlight matching repos in the dashboard table
- "info": answer a question without highlighting any repos

Rules:
- repoNames must be exact repo.name values from the list below
- Maximum 10 repo names in the array
- If no repos match, return empty array and action "info"
- Be technically precise and concise

Available repos (${repoContext.length} of ${repos.length}):
${JSON.stringify(repoContext)}`;

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 512,
      thinking: { type: 'adaptive' },
      system: systemPrompt,
      messages: [{ role: 'user', content: query }],
    });

    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('');

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    const parsed = JSON.parse(jsonMatch[0]) as GuideResponse;

    return NextResponse.json({
      message: parsed.message ?? 'Here are the matching repositories.',
      repoNames: Array.isArray(parsed.repoNames) ? parsed.repoNames : [],
      action: parsed.action ?? 'highlight',
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Guide query failed', details: String(err) },
      { status: 500 },
    );
  }
}
