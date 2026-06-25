'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ViewHeader, Card } from './SharedUI';

// ─────────────────────────────────────────────────────────────────────────
// Daily Journal — structured daily reflection with Wins, Challenges,
// and Tomorrow's Focus.
// ─────────────────────────────────────────────────────────────────────────

type JournalEntry = {
  id: string;
  entry_date: string;
  title: string | null;
  wins: string;
  challenges: string;
  tomorrows_focus: string;
  created_at: string;
  updated_at: string;
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function DailyJournalView() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // Guard: when navigating back, ignore save responses that would re-set activeEntry
  const leavingRef = useRef(false);

  // ── Fetch entries ──────────────────────────────────────────────────────
  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/journal');
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  // ── Create new entry ───────────────────────────────────────────────────
  async function createEntry() {
    const res = await fetch('/api/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (res.status === 409) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const existing = entries.find((e) => e.entry_date === todayStr);
      if (existing) {
        leavingRef.current = false;
        setActiveEntry(existing);
        return;
      }
    }
    if (res.ok) {
      const data = await res.json();
      leavingRef.current = false;
      setActiveEntry(data.entry);
      await fetchEntries();
    }
  }

  // ── Save entry (fire-and-forget when navigating back) ──────────────────
  async function saveEntry(navigatingBack = false) {
    if (!activeEntry) return;
    if (navigatingBack) leavingRef.current = true;
    setSaving(true);
    try {
      const res = await fetch(`/api/journal/${activeEntry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: activeEntry.title ?? '',
          wins: activeEntry.wins,
          challenges: activeEntry.challenges,
          tomorrows_focus: activeEntry.tomorrows_focus,
        }),
      });
      if (res.ok && !leavingRef.current) {
        const data = await res.json();
        setActiveEntry(data.entry);
      }
      await fetchEntries();
    } finally {
      setSaving(false);
    }
  }

  // ── Delete entry ───────────────────────────────────────────────────────
  async function deleteEntry() {
    if (!activeEntry) return;
    const res = await fetch(`/api/journal/${activeEntry.id}`, { method: 'DELETE' });
    if (res.ok) {
      setActiveEntry(null);
      setConfirmDelete(false);
      await fetchEntries();
    }
  }

  // ── Update local field ─────────────────────────────────────────────────
  function updateField(field: keyof JournalEntry, value: string) {
    if (!activeEntry) return;
    setActiveEntry({ ...activeEntry, [field]: value });
  }

  // ── Go back to list ────────────────────────────────────────────────────
  function goBack() {
    saveEntry(true);
    setActiveEntry(null);
    setConfirmDelete(false);
  }

  // ════════════════════════════════════════════════════════════════════════
  // DETAIL / EDIT VIEW
  // ════════════════════════════════════════════════════════════════════════
  if (activeEntry) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          background: 'radial-gradient(120% 120% at 70% -10%, var(--color-fp-bg-2, #0c0c10) 0%, var(--color-fp-bg, #060607) 55%)',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 20px 120px' }}>
          {/* Back button */}
          <button
            onClick={goBack}
            className="flex items-center gap-2 mb-6"
            style={{ color: 'var(--color-fp-ink-2)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span className="font-[var(--font-fp-mono)] text-[11px] tracking-[0.12em] uppercase">
              Back to Journal
            </span>
          </button>

          {/* Date label */}
          <div
            className="font-[var(--font-fp-mono)] text-[11px] tracking-[0.2em] uppercase mb-4"
            style={{ color: 'var(--color-fp-accent)' }}
          >
            {formatDate(activeEntry.entry_date)}
          </div>

          {/* Title input */}
          <input
            type="text"
            value={activeEntry.title ?? ''}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="Give this entry a title..."
            className="w-full bg-transparent border-none outline-none text-2xl font-bold mb-6"
            style={{
              color: 'var(--color-fp-ink)',
              fontFamily: 'var(--font-fp-display)',
            }}
          />

          {/* Sections */}
          <div className="flex flex-col gap-5">
            <JournalSection
              label="WINS"
              sublabel="What went well today"
              value={activeEntry.wins}
              onChange={(v) => updateField('wins', v)}
              iconPath="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3"
            />
            <JournalSection
              label="CHALLENGES"
              sublabel="What was tough or didn't go as planned"
              value={activeEntry.challenges}
              onChange={(v) => updateField('challenges', v)}
              iconPath="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"
            />
            <JournalSection
              label="TOMORROW'S FOCUS"
              sublabel="What to tackle next"
              value={activeEntry.tomorrows_focus}
              onChange={(v) => updateField('tomorrows_focus', v)}
              iconPath="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-8">
            <button
              onClick={() => saveEntry(false)}
              disabled={saving}
              className="flex-1 h-[46px] rounded-[var(--radius-fp-button)] font-[var(--font-fp-mono)] text-[13px] font-bold tracking-[0.1em] uppercase transition-colors"
              style={{
                backgroundColor: 'var(--color-fp-accent)',
                color: '#fff',
                border: '1px solid var(--color-fp-accent)',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>

            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="h-[46px] px-5 rounded-[var(--radius-fp-button)] font-[var(--font-fp-mono)] text-[13px] tracking-[0.1em] uppercase transition-colors"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  color: 'var(--color-fp-ink-3)',
                  border: '1px solid var(--color-fp-line)',
                }}
              >
                Delete
              </button>
            ) : (
              <button
                onClick={deleteEntry}
                className="h-[46px] px-5 rounded-[var(--radius-fp-button)] font-[var(--font-fp-mono)] text-[13px] tracking-[0.1em] uppercase transition-colors"
                style={{
                  backgroundColor: 'rgba(232,71,42,0.15)',
                  color: 'var(--color-fp-accent)',
                  border: '1px solid var(--color-fp-accent)',
                }}
              >
                Confirm Delete
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // LIST VIEW
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'radial-gradient(120% 120% at 70% -10%, var(--color-fp-bg-2, #0c0c10) 0%, var(--color-fp-bg, #060607) 55%)',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 20px 120px' }}>
        <ViewHeader
          eyebrow="REFLECT &middot; GROW &middot; REPEAT"
          title="DAILY JOURNAL"
          subtitle="Track your wins, challenges, and what's next."
        />

        {/* New Entry button */}
        <button
          type="button"
          onClick={createEntry}
          className="w-full h-[48px] rounded-[var(--radius-fp-button)] font-[var(--font-fp-mono)] text-[13px] font-bold tracking-[0.1em] uppercase mt-4 mb-6 transition-colors flex items-center justify-center gap-2"
          style={{
            backgroundColor: 'var(--color-fp-accent)',
            color: '#fff',
            border: '1px solid var(--color-fp-accent)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Entry
        </button>

        {/* Entries list */}
        {loading ? (
          <div
            className="text-center py-12 font-[var(--font-fp-mono)] text-[12px] tracking-[0.1em] uppercase"
            style={{ color: 'var(--color-fp-ink-3)' }}
          >
            Loading...
          </div>
        ) : entries.length === 0 ? (
          <Card className="p-6 text-center">
            <div
              className="font-[var(--font-fp-mono)] text-[12px] tracking-[0.1em] uppercase mb-2"
              style={{ color: 'var(--color-fp-ink-3)' }}
            >
              No entries yet
            </div>
            <div className="text-[14px]" style={{ color: 'var(--color-fp-ink-2)' }}>
              Tap &quot;New Entry&quot; to start your first journal entry.
            </div>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {entries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => { leavingRef.current = false; setActiveEntry(entry); }}
                className="w-full text-left"
              >
                <Card className="p-4 transition-colors hover:opacity-90">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-[var(--font-fp-mono)] text-[10px] tracking-[0.18em] uppercase mb-1"
                        style={{ color: 'var(--color-fp-accent)' }}
                      >
                        {formatDateShort(entry.entry_date)}
                      </div>
                      {entry.title && (
                        <div
                          className="font-bold text-[15px] truncate"
                          style={{ color: 'var(--color-fp-ink)' }}
                        >
                          {entry.title}
                        </div>
                      )}
                      {entry.wins && (
                        <div
                          className="text-[13px] mt-1 truncate"
                          style={{ color: 'var(--color-fp-ink-3)' }}
                        >
                          {entry.wins.slice(0, 80)}
                          {entry.wins.length > 80 ? '...' : ''}
                        </div>
                      )}
                    </div>
                    <svg
                      width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      style={{ color: 'var(--color-fp-ink-3)', flexShrink: 0, marginTop: 4 }}
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </Card>
              </button>
            ))}
          </div>
        )}

        {/* Back link */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="font-[var(--font-fp-mono)] text-[11px] tracking-[0.12em] uppercase"
            style={{ color: 'var(--color-fp-ink-3)' }}
          >
            &larr; Back to Flight Path
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Section textarea ─────────────────────────────────────────────────────

function JournalSection({
  label,
  sublabel,
  value,
  onChange,
  iconPath,
}: {
  label: string;
  sublabel: string;
  value: string;
  onChange: (v: string) => void;
  iconPath: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2.5 mb-2">
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ color: 'var(--color-fp-accent)', flexShrink: 0 }}
        >
          <path d={iconPath} />
        </svg>
        <span
          className="font-[var(--font-fp-mono)] text-[11px] tracking-[0.18em] uppercase font-bold"
          style={{ color: 'var(--color-fp-ink)' }}
        >
          {label}
        </span>
      </div>
      <div
        className="font-[var(--font-fp-mono)] text-[10px] tracking-[0.06em] mb-3"
        style={{ color: 'var(--color-fp-ink-3)' }}
      >
        {sublabel}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full bg-transparent border rounded-lg p-3 text-[14px] resize-none outline-none transition-colors focus:border-[var(--color-fp-accent)]"
        style={{
          color: 'var(--color-fp-ink)',
          borderColor: 'var(--color-fp-line)',
          backgroundColor: 'rgba(255,255,255,0.02)',
        }}
        placeholder={`Write about your ${label.toLowerCase()}...`}
      />
    </Card>
  );
}
