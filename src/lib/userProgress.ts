const PROGRESS_KEY = 'metamorph-user-progress';

export interface Progress {
  viewedRepos: string[];   // "org/name"
  generatedCount: number;
  firstVisit: string;      // ISO
  lastVisit: string;       // ISO
  lastRepoCount: number;
}

const defaults = (): Progress => ({
  viewedRepos: [],
  generatedCount: 0,
  firstVisit: new Date().toISOString(),
  lastVisit: new Date().toISOString(),
  lastRepoCount: 0,
});

export function getProgress(): Progress | null {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Progress;
  } catch { return null; }
}

export function saveProgress(p: Progress): void {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch {}
}

export function initProgress(): Progress {
  const existing = getProgress();
  if (existing) return existing;
  const p = defaults();
  saveProgress(p);
  return p;
}

export function markRepoViewed(org: string, name: string): void {
  const p = getProgress() ?? defaults();
  const key = `${org}/${name}`;
  if (!p.viewedRepos.includes(key)) {
    p.viewedRepos = [...p.viewedRepos, key];
    saveProgress(p);
    window.dispatchEvent(new Event('metamorph-progress-updated'));
  }
}

export function recordGeneration(): void {
  const p = getProgress() ?? defaults();
  p.generatedCount += 1;
  saveProgress(p);
}

export function refreshVisit(currentRepoCount: number): { newRepos: number } {
  const p = getProgress() ?? defaults();
  const newRepos = Math.max(0, currentRepoCount - p.lastRepoCount);
  p.lastVisit = new Date().toISOString();
  p.lastRepoCount = currentRepoCount;
  saveProgress(p);
  return { newRepos };
}

export function welcomeMessage(p: Progress, totalRepos: number): string {
  const viewedCount = p.viewedRepos.length;
  const pct = totalRepos > 0 ? Math.round((viewedCount / totalRepos) * 100) : 0;
  const newSince = Math.max(0, totalRepos - p.lastRepoCount);

  const parts: string[] = [];
  if (viewedCount > 0) {
    parts.push(`You've explored ${viewedCount} of ${totalRepos} repos (${pct}%).`);
  }
  if (newSince > 0) {
    parts.push(`${newSince} new repo${newSince !== 1 ? 's' : ''} added since your last visit.`);
  }
  if (p.generatedCount > 0) {
    parts.push(`${p.generatedCount} content piece${p.generatedCount !== 1 ? 's' : ''} generated.`);
  }
  return parts.length > 0 ? parts.join(' ') : `Welcome back. ${totalRepos} repos tracked across 3 orgs.`;
}

export function isReturningUser(): boolean {
  return getProgress() !== null;
}
