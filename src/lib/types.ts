export type OrgName = 'trailofbits' | 'crytic' | 'lifting-bits';

export interface BlogPost {
  title: string;
  url: string;
}

export interface Repo {
  name: string;
  org: OrgName;
  stars: number;
  pushedAt: string;
  description: string | null;
  htmlUrl: string;
  language: string | null;
  topics: string[];
  isHiddenGem: boolean;
  blogMentions: BlogPost[];
  activityScore: number;
}

export interface DeltaResult {
  repos: Repo[];
  hiddenGems: Repo[];
  blogSources: BlogPost[];
  stats: {
    totalRepos: number;
    hiddenGemsCount: number;
    coveredCount: number;
    coveragePercent: number;
    lastUpdated: string;
  };
  rateLimitWarning: boolean;
  scrapeErrors: string[];
}
