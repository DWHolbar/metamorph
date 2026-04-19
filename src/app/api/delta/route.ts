import { NextResponse } from 'next/server';
import { fetchAllOrgs } from '@/lib/github';
import { scrapeBlog, scrapeOpensourcePage } from '@/lib/scraper';
import { computeDelta } from '@/lib/delta';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  try {
    const scrapeErrors: string[] = [];

    const [orgsResult, blogResult, opensourceResult] = await Promise.allSettled([
      fetchAllOrgs(),
      scrapeBlog(),
      scrapeOpensourcePage(),
    ]);

    if (orgsResult.status === 'rejected') {
      return NextResponse.json(
        {
          error: 'Failed to fetch GitHub repositories',
          details: String(orgsResult.reason),
        },
        { status: 500 },
      );
    }

    const { repos, rateLimitWarning } = orgsResult.value;
    const blogSources = blogResult.status === 'fulfilled' ? blogResult.value : [];
    const opensourceNames =
      opensourceResult.status === 'fulfilled' ? opensourceResult.value : [];

    if (blogResult.status === 'rejected') {
      scrapeErrors.push(`Blog scraping failed: ${String(blogResult.reason)}`);
    }
    if (opensourceResult.status === 'rejected') {
      scrapeErrors.push(
        `Opensource page scraping failed: ${String(opensourceResult.reason)}`,
      );
    }

    const delta = computeDelta(repos, blogSources, opensourceNames);

    return NextResponse.json({ ...delta, rateLimitWarning, scrapeErrors });
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error', details: String(err) },
      { status: 500 },
    );
  }
}
