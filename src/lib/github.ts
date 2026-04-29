import type { OrgName, Repo } from './types';

const ORGS: OrgName[] = ['trailofbits', 'crytic', 'lifting-bits'];

function buildHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

function parseLinkNext(link: string | null): string | null {
  if (!link) return null;
  const match = link.match(/<([^>]+)>;\s*rel="next"/);
  return match ? match[1] : null;
}

async function fetchReposForOrg(org: OrgName): Promise<Repo[]> {
  const repos: Repo[] = [];
  let url: string | null =
    `https://api.github.com/orgs/${org}/repos?per_page=100&sort=pushed&type=public`;
  const headers = buildHeaders();

  while (url) {
    const res = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      if (res.status === 403 || res.status === 429) {
        throw new Error(`Rate limit hit for ${org}: ${res.status}`);
      }
      throw new Error(`GitHub API ${res.status} for ${org}`);
    }

    const data = (await res.json()) as Record<string, unknown>[];
    for (const r of data) {
      if (r.archived || r.fork) continue;
      repos.push({
        name: String(r.name),
        org,
        stars: Number(r.stargazers_count),
        pushedAt: String(r.pushed_at),
        createdAt: String(r.created_at),
        description: r.description ? String(r.description) : null,
        htmlUrl: String(r.html_url),
        language: r.language ? String(r.language) : null,
        topics: Array.isArray(r.topics) ? (r.topics as string[]).map(String) : [],
        isHiddenGem: false,
        isNew: false,
        blogMentions: [],
        activityScore: 0,
      });
    }

    url = parseLinkNext(res.headers.get('Link'));
  }

  return repos;
}

export async function fetchAllOrgs(): Promise<{ repos: Repo[] }> {
  const results = await Promise.allSettled(ORGS.map(fetchReposForOrg));
  const repos = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
  return { repos };
}
