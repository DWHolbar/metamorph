export type OrgName = 'trailofbits' | 'crytic' | 'lifting-bits';

export interface BlogPost {
  title: string;
  url: string;
}

export interface NewsArticle {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  repoMatches: string[];
}

export interface HNPost {
  title: string;
  url: string;
  hnUrl: string;
  points: number;
  numComments: number;
  publishedAt: string;
  repoMatches: string[];
}

export interface Tweet {
  text: string;
  url: string;
  publishedAt: string;
  repoMatches: string[];
}

export interface Repo {
  name: string;
  org: OrgName;
  stars: number;
  pushedAt: string;
  createdAt: string;
  description: string | null;
  htmlUrl: string;
  language: string | null;
  topics: string[];
  isHiddenGem: boolean;
  isNew: boolean;
  blogMentions: BlogPost[];
  activityScore: number;
}

export interface DeltaResult {
  repos: Repo[];
  hiddenGems: Repo[];
  blogSources: BlogPost[];
  newsArticles: NewsArticle[];
  hnPosts: HNPost[];
  tweets: Tweet[];
  stats: {
    totalRepos: number;
    hiddenGemsCount: number;
    coveredCount: number;
    coveragePercent: number;
    newReposCount: number;
    lastUpdated: string;
  };
  rateLimitWarning: boolean;
  scrapeErrors: string[];
}

export type ContentType =
  | 'tweet-short'
  | 'tweet-thread'
  | 'linkedin'
  | 'blog-outline'
  | 'blog-full'
  | 'newsletter'
  | 'pr-pitch'
  | 'technical-faq';

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  'tweet-short': 'Tweet (short)',
  'tweet-thread': 'Tweet Thread',
  linkedin: 'LinkedIn Post',
  'blog-outline': 'Blog Post Outline',
  'blog-full': 'Blog Post (full)',
  newsletter: 'Newsletter Blurb',
  'pr-pitch': 'PR Article Pitch',
  'technical-faq': 'Technical FAQ',
};
