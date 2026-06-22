'use client';

import { useEffect } from 'react';
import type { ChatThreadSummary } from '@/lib/types';

// ChatSidebar — left-side slide-out listing past conversations.
//
// Behavior:
//   • Scrim click + Esc dismiss the drawer.
//   • "New chat" clears the active thread in the parent (no backend call);
//     the actual thread row is created lazily on the first /api/chat send.
//   • Selecting a thread fetches its messages via /api/chat/threads/[id].
//   • Hovering a row reveals a trash button that deletes the thread.
//
// The sidebar is intentionally dumb: all state (threads, active id, loading)
// is owned by the parent so it survives open/close cycles.

const RELATIVE_UNITS: Array<{ unit: Intl.RelativeTimeFormatUnit; ms: number }> = [
  { unit: 'year', ms: 31_536_000_000 },
  { unit: 'month', ms: 2_592_000_000 },
  { unit: 'day', ms: 86_400_000 },
  { unit: 'hour', ms: 3_600_000 },
  { unit: 'minute', ms: 60_000 },
];

const relativeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

/** "5m ago", "yesterday", "last week" — falls back to a date string. */
function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = then - Date.now();
  for (const { unit, ms } of RELATIVE_UNITS) {
    if (Math.abs(diff) >= ms) {
      return relativeFormatter.format(Math.round(diff / ms), unit);
    }
  }
  return 'just now';
}

export function ChatSidebar({
  isOpen,
  threads,
  activeThreadId,
  isLoading,
  onClose,
  onSelect,
  onNewChat,
  onDelete,
}: {
  isOpen: boolean;
  threads: ChatThreadSummary[];
  activeThreadId: string | null;
  isLoading: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
}) {
  // Esc to close.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Scrim */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        className="fixed top-0 left-0 bottom-0 w-[84%] max-w-[320px] z-50 flex flex-col"
        style={{
          backgroundColor: 'var(--color-fp-bg-2)',
          borderRight: '1px solid var(--color-fp-line)',
        }}
        aria-label="Chat conversations"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--color-fp-line)' }}
        >
          <span
            className="font-[var(--font-fp-mono)] text-[10px] tracking-[0.18em] uppercase"
            style={{ color: 'var(--color-fp-ink-3)' }}
          >
            Conversations
          </span>
          <button
            onClick={onClose}
            aria-label="Close conversations"
            className="w-7 h-7 flex items-center justify-center rounded-full transition-colors hover:bg-white/5"
            style={{ color: 'var(--color-fp-ink-3)' }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* New chat */}
        <div className="px-3 pt-3 pb-2">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 h-10 rounded-[10px] transition-colors"
            style={{
              backgroundColor: activeThreadId === null ? 'var(--color-fp-accent)' : 'transparent',
              border:
                activeThreadId === null
                  ? '1px solid var(--color-fp-accent)'
                  : '1px solid var(--color-fp-line)',
              color: activeThreadId === null ? '#fff' : 'var(--color-fp-ink-2)',
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span className="font-[var(--font-fp-mono)] text-[11px] tracking-[0.14em] uppercase">
              New chat
            </span>
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {isLoading ? (
            <div
              className="px-3 py-6 text-center font-[var(--font-fp-sans)] text-[12px]"
              style={{ color: 'var(--color-fp-ink-3)' }}
            >
              Loading…
            </div>
          ) : threads.length === 0 ? (
            <div
              className="px-3 py-6 text-center font-[var(--font-fp-sans)] text-[12px]"
              style={{ color: 'var(--color-fp-ink-3)' }}
            >
              No conversations yet.
            </div>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {threads.map((t) => {
                const isActive = t.id === activeThreadId;
                return (
                  <li key={t.id}>
                    <div
                      className="group relative flex items-stretch rounded-[8px] transition-colors"
                      style={{
                        backgroundColor: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                      }}
                    >
                      <button
                        onClick={() => {
                          onSelect(t.id);
                          onClose();
                        }}
                        className="flex-1 min-w-0 text-left px-3 py-2.5"
                      >
                        <div
                          className="font-[var(--font-fp-sans)] text-[13px] truncate"
                          style={{
                            color: isActive ? 'var(--color-fp-ink)' : 'var(--color-fp-ink-2)',
                          }}
                        >
                          {t.title || 'New conversation'}
                        </div>
                        <div
                          className="font-[var(--font-fp-mono)] text-[9px] tracking-[0.1em] uppercase mt-1 truncate"
                          style={{ color: 'var(--color-fp-ink-3)' }}
                          title={t.lastMessagePreview ?? ''}
                        >
                          {t.messageCount > 0
                            ? `${formatRelative(t.updatedAt)} · ${t.messageCount} msg`
                            : formatRelative(t.updatedAt)}
                        </div>
                      </button>

                      {/* Delete (visible on hover) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            window.confirm(
                              `Delete "${t.title || 'New conversation'}"? This can't be undone.`
                            )
                          ) {
                            onDelete(t.id);
                          }
                        }}
                        aria-label="Delete conversation"
                        className="opacity-0 group-hover:opacity-100 self-center mr-2 w-7 h-7 flex items-center justify-center rounded-[6px] transition-opacity hover:bg-white/10"
                        style={{ color: 'var(--color-fp-ink-3)' }}
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer note */}
        <div
          className="px-4 py-3 border-t font-[var(--font-fp-mono)] text-[9px] tracking-[0.1em] uppercase"
          style={{
            borderColor: 'var(--color-fp-line)',
            color: 'var(--color-fp-ink-3)',
          }}
        >
          Conversations auto-clear after 45 days
        </div>
      </aside>
    </>
  );
}
