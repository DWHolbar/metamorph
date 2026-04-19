import { differenceInDays } from 'date-fns';
import type { Repo, BlogPost, DeltaResult } from './types';

const GEM_MIN_STARS = parseInt(process.env.GEM_MIN_STARS ?? '5');
const GEM_MAX_DAYS = parseInt(process.env.GEM_MIN_DAYS_SINCE_PUSH ?? '180');

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[-_.]/g, '')
    .replace(/\s+/g, '');
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isMentionedInCorpus(repoName: string, corpus: string): boolean {
  const slug = slugify(repoName);
  if (slug.length < 4) {
    return (
      corpus.includes(` ${slug} `) ||
      corpus.startsWith(`${slug} `) ||
      corpus.endsWith(` ${slug}`)
    );
  }
  const pattern = new RegExp(
    `(?<![a-z0-9])${escapeRegex(slug)}(?![a-z0-9])`,
    'i',
  );
  return pattern.test(corpus);
}

function computeActivityScore(repo: Repo): number {
  const daysSincePush = differenceInDays(new Date(), new Date(repo.pushedAt));
  const recencyScore = Math.max(0, 365 - daysSincePush) / 365;
  const starScore = Math.log10(Math.max(1, repo.stars));
  return starScore * 0.6 + recencyScore * 0.4;
}

export function computeDelta(
  repos: Repo[],
  blogSources: BlogPost[],
  opensourceNames: string[],
): Omit<DeltaResult, 'rateLimitWarning' | 'scrapeErrors'> {
  const corpus = slugify(
    [...blogSources.map((p) => p.title), ...opensourceNames].join(' '),
  );

  const enriched = repos.map((repo) => {
    const mentioned = isMentionedInCorpus(repo.name, corpus);
    const blogMentions =
      repo.name.length >= 4
        ? blogSources.filter((post) =>
            slugify(post.title).includes(slugify(repo.name)),
          )
        : [];

    const daysSincePush = differenceInDays(new Date(), new Date(repo.pushedAt));
    const isHighActivity =
      repo.stars >= GEM_MIN_STARS || daysSincePush <= GEM_MAX_DAYS;
    const score = computeActivityScore(repo);

    return {
      ...repo,
      blogMentions,
      isHiddenGem: !mentioned && isHighActivity,
      activityScore: score,
    };
  });

  const sorted = [...enriched].sort((a, b) => b.activityScore - a.activityScore);
  const hiddenGems = sorted.filter((r) => r.isHiddenGem);
  const coveredCount = sorted.filter((r) => r.blogMentions.length > 0).length;

  return {
    repos: sorted,
    hiddenGems,
    blogSources,
    stats: {
      totalRepos: sorted.length,
      hiddenGemsCount: hiddenGems.length,
      coveredCount,
      coveragePercent: Math.round(
        (coveredCount / Math.max(1, sorted.length)) * 100,
      ),
      lastUpdated: new Date().toISOString(),
    },
  };
}
