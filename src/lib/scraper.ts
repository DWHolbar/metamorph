import { XMLParser } from 'fast-xml-parser';
import { load } from 'cheerio';
import type { BlogPost } from './types';

const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml,application/rss+xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

async function safeFetch(url: string, timeout = 4000): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: FETCH_HEADERS,
      signal: AbortSignal.timeout(timeout),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function scrapeBlog(): Promise<BlogPost[]> {
  const parser = new XMLParser({ ignoreAttributes: false });
  const seen = new Set<string>();
  const posts: BlogPost[] = [];

  // Fetch first 3 RSS pages in parallel
  const rssUrls = [
    'https://blog.trailofbits.com/feed/',
    'https://blog.trailofbits.com/feed/?paged=2',
    'https://blog.trailofbits.com/feed/?paged=3',
  ];
  const rssResults = await Promise.allSettled(rssUrls.map((url) => safeFetch(url)));

  for (const result of rssResults) {
    if (result.status !== 'fulfilled' || !result.value) continue;
    try {
      const feed = parser.parse(result.value) as Record<string, unknown>;
      const channel = (feed?.rss as Record<string, unknown>)?.channel as Record<string, unknown>;
      const items = channel?.item;
      if (!items) continue;
      const arr = Array.isArray(items) ? items : [items];
      for (const item of arr as Record<string, unknown>[]) {
        const title = item.title ? String(item.title) : null;
        const link = item.link ? String(item.link) : null;
        if (title && link && !seen.has(link)) {
          seen.add(link);
          posts.push({ title, url: link });
        }
      }
    } catch { continue; }
  }

  // Fallback: single HTML page scrape
  if (posts.length === 0) {
    const html = await safeFetch('https://blog.trailofbits.com/');
    if (html) {
      const $ = load(html);
      $('article h2 a, article h1 a, .post-title a, h2.entry-title a').each((_, el) => {
        const title = $(el).text().trim();
        const href = $(el).attr('href');
        if (title && href && !seen.has(href)) {
          seen.add(href);
          posts.push({ title, url: href });
        }
      });
    }
  }

  return posts;
}

export async function scrapeOpensourcePage(): Promise<string[]> {
  const names: string[] = [];
  const html = await safeFetch('https://www.trailofbits.com/opensource/');
  if (!html) return names;

  const $ = load(html);

  // Extract repo names from GitHub URLs (most reliable)
  $('a[href*="github.com"]').each((_, el) => {
    const href = $(el).attr('href') ?? '';
    const match = href.match(/github\.com\/[^/]+\/([^/\s?#]+)/);
    if (match) names.push(match[1].toLowerCase());
  });

  // Extract text from headings that might be tool names
  $('h3, h4, .tool-name').each((_, el) => {
    const text = $(el).text().trim().toLowerCase();
    if (text && text.length > 2 && text.length < 50) names.push(text);
  });

  return [...new Set(names)];
}
