import { XMLParser } from 'fast-xml-parser';
import type { NewsArticle, HNPost, Tweet } from './types';

async function safeFetch(url: string, timeoutMs = 8000): Promise<Response | null> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    clearTimeout(id);
    return res.ok ? res : null;
  } catch {
    clearTimeout(id);
    return null;
  }
}

function matchRepos(text: string, repoNames: string[]): string[] {
  const lower = text.toLowerCase();
  return repoNames.filter((n) => n.length > 3 && lower.includes(n.toLowerCase()));
}

export async function fetchNewsArticles(repoNames: string[]): Promise<NewsArticle[]> {
  const res = await safeFetch(
    'https://www.bing.com/news/search?q=%22trail+of+bits%22&format=RSS',
  );
  if (!res) return [];
  try {
    const xml = await res.text();
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
    const parsed = parser.parse(xml);
    const raw = parsed?.rss?.channel?.item ?? [];
    const items: Record<string, unknown>[] = Array.isArray(raw) ? raw : [raw];
    return items.slice(0, 20).map((item) => {
      const title = String(item.title ?? '');
      const url = String(item.link ?? '');
      const src = item.source;
      const source = typeof src === 'object' && src !== null
        ? String((src as Record<string, unknown>)['#text'] ?? 'News')
        : String(src ?? 'News');
      const publishedAt = String(item.pubDate ?? '');
      return { title, url, source, publishedAt, repoMatches: matchRepos(title, repoNames) };
    });
  } catch {
    return [];
  }
}

export async function fetchHNPosts(repoNames: string[]): Promise<HNPost[]> {
  const res = await safeFetch(
    'https://hn.algolia.com/api/v1/search?query=%22trail+of+bits%22&tags=story&hitsPerPage=20',
  );
  if (!res) return [];
  try {
    const data = await res.json() as { hits: Record<string, unknown>[] };
    return (data.hits ?? []).map((h) => {
      const title = String(h.title ?? '');
      const url = String(h.url ?? `https://news.ycombinator.com/item?id=${h.objectID}`);
      const hnUrl = `https://news.ycombinator.com/item?id=${h.objectID}`;
      const points = Number(h.points ?? 0);
      const numComments = Number(h.num_comments ?? 0);
      const publishedAt = String(h.created_at ?? '');
      return {
        title, url, hnUrl, points, numComments, publishedAt,
        repoMatches: matchRepos(title + ' ' + url, repoNames),
      };
    });
  } catch {
    return [];
  }
}

const NITTER_INSTANCES = [
  'https://nitter.net/trailofbits/rss',
  'https://nitter.privacydev.net/trailofbits/rss',
  'https://nitter.poast.org/trailofbits/rss',
  'https://nitter.bird.froth.zone/trailofbits/rss',
  'https://nitter.1d4.us/trailofbits/rss',
  'https://nitter.kavin.rocks/trailofbits/rss',
  'https://nitter.unixfox.eu/trailofbits/rss',
  'https://nitter.domain.glass/trailofbits/rss',
  'https://nitter.moomoo.me/trailofbits/rss',
  'https://nitter.eu.projectsegfau.lt/trailofbits/rss',
  'https://nitter.namazso.eu/trailofbits/rss',
  'https://nitter.cz/trailofbits/rss',
  'https://nitter.it/trailofbits/rss',
  'https://nitter.privacy.com.de/trailofbits/rss',
  'https://nitter.mint.lgbt/trailofbits/rss',
];

export async function fetchTweets(repoNames: string[]): Promise<Tweet[]> {
  for (const nitterUrl of NITTER_INSTANCES) {
    const res = await safeFetch(nitterUrl, 5000);
    if (!res) continue;
    try {
      const xml = await res.text();
      const parser = new XMLParser({ ignoreAttributes: false });
      const parsed = parser.parse(xml);
      const raw = parsed?.rss?.channel?.item ?? [];
      const items: Record<string, string>[] = Array.isArray(raw) ? raw : [raw];
      return items.slice(0, 20).map((item) => {
        const text = String(item.title ?? '');
        const tweetUrl = String(item.link ?? '')
          .replace(/^https?:\/\/nitter\.[^/]+/, 'https://x.com');
        const publishedAt = String(item.pubDate ?? '');
        return { text, url: tweetUrl, publishedAt, repoMatches: matchRepos(text, repoNames) };
      });
    } catch {
      continue;
    }
  }
  return [];
}
