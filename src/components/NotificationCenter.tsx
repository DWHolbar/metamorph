'use client';

import { useEffect, useRef, useState } from 'react';
import {
  getNotifications,
  saveNotifications,
  isNotificationsDisabled,
  setNotificationsDisabled,
  getMutedRepos,
  muteRepo,
  markAllRead,
  clearAllNotifications,
  type RepoNotification,
} from '@/lib/notifications';

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<RepoNotification[]>([]);
  const [disabled, setDisabled] = useState(false);
  const [muted, setMuted] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  function reload() {
    setNotifs(getNotifications());
    setDisabled(isNotificationsDisabled());
    setMuted(getMutedRepos());
  }

  useEffect(() => {
    reload();
    const handler = () => reload();
    window.addEventListener('metamorph-notifications-updated', handler);
    return () => window.removeEventListener('metamorph-notifications-updated', handler);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleOpen() {
    setOpen(o => !o);
  }

  function handleMarkAllRead() {
    markAllRead();
    reload();
  }

  function handleClear() {
    clearAllNotifications();
    reload();
  }

  function handleToggleDisabled() {
    setNotificationsDisabled(!disabled);
    reload();
  }

  function handleMute(repoKey: string) {
    muteRepo(repoKey);
    // Remove all notifications for this repo
    const updated = getNotifications().filter(
      n => `${n.repoOrg}/${n.repoName}` !== repoKey
    );
    saveNotifications(updated);
    reload();
  }

  const unread = notifs.filter(n => !n.read).length;

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={handleOpen}
        title={disabled ? 'Notifications disabled' : `${unread} unread notification${unread !== 1 ? 's' : ''}`}
        className="relative flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
      >
        {disabled ? (
          /* Bell-slash SVG */
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            <path d="M18.63 13A17.89 17.89 0 0 1 18 8"/>
            <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/>
            <path d="M18 8a6 6 0 0 0-9.33-5"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        )}
        {!disabled && unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-emerald-500 text-white text-[10px] font-bold px-1">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 sm:w-96 rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
            <span className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
              Notifications
              {unread > 0 && (
                <span className="ml-2 text-xs font-mono px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                  {unread} new
                </span>
              )}
            </span>
            <div className="flex items-center gap-2">
              {notifs.length > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300 transition-colors"
                >
                  Mark all read
                </button>
              )}
              {notifs.length > 0 && (
                <button
                  onClick={handleClear}
                  className="text-xs text-gray-400 dark:text-zinc-500 hover:text-red-500 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-zinc-800">
            {disabled ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400 dark:text-zinc-600">
                Notifications are disabled
              </div>
            ) : notifs.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400 dark:text-zinc-600">
                No notifications yet — new and updated repos will appear here
              </div>
            ) : (
              notifs.map((n) => {
                const repoKey = `${n.repoOrg}/${n.repoName}`;
                const isMuted_ = muted.includes(repoKey);
                return (
                  <div
                    key={n.id}
                    className={`group flex items-start gap-3 px-4 py-3 ${n.read ? 'opacity-60' : ''} hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors`}
                  >
                    {/* Icon */}
                    <div className={`mt-0.5 shrink-0 w-7 h-7 flex items-center justify-center rounded-full ${n.type === 'new-repo' ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' : 'bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'}`}>
                      {n.type === 'new-repo' ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                        </svg>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <a
                        href={n.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          const updated = getNotifications().map(x => x.id === n.id ? { ...x, read: true } : x);
                          saveNotifications(updated);
                          reload();
                        }}
                        className="block font-mono text-sm font-semibold text-gray-900 dark:text-zinc-100 hover:text-emerald-600 dark:hover:text-emerald-400 truncate transition-colors"
                      >
                        {n.repoName}
                      </a>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{n.detail}</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-600 mt-0.5">{n.repoOrg} · {timeAgo(n.timestamp)}</p>
                    </div>

                    {/* Mute button */}
                    {!isMuted_ && (
                      <button
                        onClick={() => handleMute(repoKey)}
                        title="Mute notifications for this repo"
                        className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 dark:text-zinc-600 hover:text-gray-500 dark:hover:text-zinc-400"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="1" y1="1" x2="23" y2="23"/>
                          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                          <path d="M18.63 13A17.89 17.89 0 0 1 18 8"/>
                          <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/>
                          <path d="M18 8a6 6 0 0 0-9.33-5"/>
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer: global disable toggle */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
            <span className="text-xs text-gray-500 dark:text-zinc-400">
              All notifications
            </span>
            <button
              onClick={handleToggleDisabled}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${disabled ? 'bg-gray-300 dark:bg-zinc-700' : 'bg-emerald-500'}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${disabled ? 'translate-x-1' : 'translate-x-4'}`} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
