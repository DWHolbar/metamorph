import type { Repo } from './types';

export interface RepoNotification {
  id: string;
  type: 'new-repo' | 'repo-updated';
  repoName: string;
  repoOrg: string;
  repoUrl: string;
  detail: string;
  timestamp: string;
  read: boolean;
}

const NOTIFICATIONS_KEY = 'metamorph-notifications';
const DISABLED_KEY = 'metamorph-notifications-disabled';
const MUTED_KEY = 'metamorph-muted-repos';
const PREV_REPOS_KEY = 'metamorph-prev-repos';

export function getNotifications(): RepoNotification[] {
  try { return JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) ?? '[]'); } catch { return []; }
}

export function saveNotifications(notifs: RepoNotification[]) {
  try { localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifs.slice(0, 100))); } catch {}
}

export function isNotificationsDisabled(): boolean {
  try { return localStorage.getItem(DISABLED_KEY) === 'true'; } catch { return false; }
}

export function setNotificationsDisabled(val: boolean) {
  try { localStorage.setItem(DISABLED_KEY, String(val)); } catch {}
}

export function getMutedRepos(): string[] {
  try { return JSON.parse(localStorage.getItem(MUTED_KEY) ?? '[]'); } catch { return []; }
}

export function muteRepo(key: string) {
  const muted = getMutedRepos();
  if (!muted.includes(key)) {
    try { localStorage.setItem(MUTED_KEY, JSON.stringify([...muted, key])); } catch {}
  }
}

export function unmuteRepo(key: string) {
  try { localStorage.setItem(MUTED_KEY, JSON.stringify(getMutedRepos().filter(k => k !== key))); } catch {}
}

export function markAllRead() {
  saveNotifications(getNotifications().map(n => ({ ...n, read: true })));
}

export function clearAllNotifications() {
  try { localStorage.removeItem(NOTIFICATIONS_KEY); } catch {}
}

export function getPrevRepos(): Repo[] {
  try { return JSON.parse(localStorage.getItem(PREV_REPOS_KEY) ?? '[]'); } catch { return []; }
}

export function savePrevRepos(repos: Repo[]) {
  try { localStorage.setItem(PREV_REPOS_KEY, JSON.stringify(repos)); } catch {}
}

export function computeNewNotifications(prev: Repo[], next: Repo[]): RepoNotification[] {
  if (isNotificationsDisabled() || prev.length === 0) return [];
  const muted = getMutedRepos();
  const prevMap = new Map(prev.map(r => [`${r.org}/${r.name}`, r]));
  const existing = new Set(getNotifications().map(n => n.id));
  const now = new Date().toISOString();
  const notifs: RepoNotification[] = [];

  for (const repo of next) {
    const key = `${repo.org}/${repo.name}`;
    if (muted.includes(key)) continue;
    const prev_ = prevMap.get(key);
    if (!prev_) {
      const id = `${key}-new-${now}`;
      if (!existing.has(id)) {
        notifs.push({
          id,
          type: 'new-repo',
          repoName: repo.name,
          repoOrg: repo.org,
          repoUrl: repo.htmlUrl,
          detail: 'New repository added to ' + repo.org,
          timestamp: now,
          read: false,
        });
      }
    } else if (prev_.pushedAt !== repo.pushedAt) {
      const id = `${key}-updated-${repo.pushedAt}`;
      if (!existing.has(id)) {
        notifs.push({
          id,
          type: 'repo-updated',
          repoName: repo.name,
          repoOrg: repo.org,
          repoUrl: repo.htmlUrl,
          detail: `New commits — last push ${new Date(repo.pushedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
          timestamp: now,
          read: false,
        });
      }
    }
  }
  return notifs;
}
