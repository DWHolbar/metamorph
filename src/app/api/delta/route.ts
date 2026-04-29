import { NextResponse } from 'next/server';
import { fetchAllOrgs } from '@/lib/github';
import { scrapeBlog, scrapeOpensourcePage } from '@/lib/scraper';
import { computeDelta } from '@/lib/delta';
import { fetchNewsArticles, fetchHNPosts, fetchTweets } from '@/lib/social';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const scrapeErrors: string[] = [];

    const [orgsResult, blogResult, opensourceResult, newsResult, hnResult, tweetsResult] =
      await Promise.allSettled([
        fetchAllOrgs(),
        scrapeBlog(),
        scrapeOpensourcePage(),
        fetchNewsArticles([]),  // repo matching done below once we have names
        fetchHNPosts([]),
        fetchTweets([]),
      ]);

    if (orgsResult.status === 'rejected') {
      return NextResponse.json(
        { error: 'Failed to fetch GitHub repositories', details: String(orgsResult.reason) },
        { status: 500 },
      );
    }

    const { repos, rateLimitWarning } = orgsResult.value;
    const blogSources = blogResult.status === 'fulfilled' ? blogResult.value : [];
    const opensourceNames = opensourceResult.status === 'fulfilled' ? opensourceResult.value : [];
    const rawNews = newsResult.status === 'fulfilled' ? newsResult.value : [];
    const rawHN = hnResult.status === 'fulfilled' ? hnResult.value : [];
    const rawTweets = tweetsResult.status === 'fulfilled' ? tweetsResult.value : [];

    if (blogResult.status === 'rejected')
      scrapeErrors.push(`Blog scraping failed: ${String(blogResult.reason)}`);
    if (opensourceResult.status === 'rejected')
      scrapeErrors.push(`Opensource page scraping failed: ${String(opensourceResult.reason)}`);

    const delta = computeDelta(repos, blogSources, opensourceNames);

    // Match repo names into social/news results
    const repoNames = delta.repos.map((r) => r.name);
    function withMatches<T extends { repoMatches: string[] }>(
      items: T[],
      getText: (item: T) => string,
    ): T[] {
      return items.map((item) => ({
        ...item,
        repoMatches: repoNames.filter(
          (n) => n.length > 3 && getText(item).toLowerCase().includes(n.toLowerCase()),
        ),
      }));
    }

    const newsArticles = withMatches(rawNews, (a) => a.title);
    const hnPosts = withMatches(rawHN, (h) => h.title + ' ' + h.url);
    const tweets = withMatches(rawTweets, (t) => t.text);

    return NextResponse.json({
      ...delta,
      newsArticles,
      hnPosts,
      tweets,
      rateLimitWarning,
      scrapeErrors,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error', details: String(err) },
      { status: 500 },
    );
  }
}
