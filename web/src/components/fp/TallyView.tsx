'use client';

import { useState, useEffect, useCallback } from 'react';
import { ViewHeader, ViewBackground, Card, CounterButton, ProgressBar } from './SharedUI';

type Totals = {
  doors: number;
  conversations: number;
  appointments: number;
};

const EMPTY: Totals = { doors: 0, conversations: 0, appointments: 0 };

export function TallyView() {
  const [totals, setTotals] = useState<Totals>(EMPTY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/tally', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d.totals) setTotals(d.totals);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const increment = useCallback(async (metric: keyof Totals, delta: 1 | -1) => {
    // Optimistic update
    setTotals((prev) => ({
      ...prev,
      [metric]: Math.max(0, prev[metric] + delta),
    }));
    try {
      const res = await fetch('/api/tally', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ metric, amount: delta }),
      });
      const d = await res.json();
      if (d.totals) setTotals(d.totals);
    } catch {
      // Revert on failure
      setTotals((prev) => ({
        ...prev,
        [metric]: Math.max(0, prev[metric] - delta),
      }));
    }
  }, []);

  const doorsGoal = 40;
  const conversationsGoal = 15;
  const appointmentsGoal = 5;

  const { doors, conversations, appointments } = totals;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <ViewBackground imageName="tally_bg.png" />

      <div className="absolute inset-0 overflow-y-auto px-5 py-6 md:px-8 md:py-8">
        <ViewHeader
          eyebrow="Field Tracker"
          title="Tally"
          subtitle="All-time · tap to log your activity"
        />

        {!loaded ? (
          <Card className="p-8 max-w-2xl">
            <div
              className="font-[var(--font-fp-mono)] text-[11px] tracking-[0.1em]"
              style={{ color: 'var(--color-fp-ink-3)' }}
            >
              Loading your stats...
            </div>
          </Card>
        ) : (
          <>
            {/* Primary metric */}
            <Card className="p-5 md:p-6 mb-3.5 max-w-2xl" radius="var(--radius-fp-card-lg)">
              <div
                className="font-[var(--font-fp-mono)] text-[10px] tracking-[0.22em] uppercase mb-1.5"
                style={{ color: 'var(--color-fp-ink-3)' }}
              >
                Doors Knocked
              </div>

              <div className="flex items-end gap-2.5 mb-3.5">
                <span
                  className="font-[var(--font-fp-display)] text-6xl md:text-7xl leading-[0.85] tracking-[0.01em]"
                  style={{ color: 'var(--color-fp-ink)' }}
                >
                  {doors}
                </span>
                <span
                  className="font-[var(--font-fp-mono)] text-[12px] pb-2.5"
                  style={{ color: 'var(--color-fp-ink-2)' }}
                >
                  / {doorsGoal} goal
                </span>
              </div>

              <ProgressBar progress={Math.min(1, doors / doorsGoal)} />

              <div className="flex gap-2.5">
                <CounterButton onClick={() => doors > 0 && increment('doors', -1)}>
                  −
                </CounterButton>
                <CounterButton primary onClick={() => increment('doors', 1)}>
                  + Knock
                </CounterButton>
              </div>
            </Card>

            {/* Secondary metrics */}
            <div className="flex gap-2.5 max-w-2xl">
              <Card className="flex-1 p-3.5" radius="var(--radius-fp-tile)">
                <div
                  className="font-[var(--font-fp-display)] text-4xl leading-none mb-1"
                  style={{ color: 'var(--color-fp-ink)' }}
                >
                  {conversations}
                </div>
                <div
                  className="font-[var(--font-fp-mono)] text-[9.5px] tracking-[0.14em] uppercase mb-2.5"
                  style={{ color: 'var(--color-fp-ink-3)' }}
                >
                  Conversations
                </div>
                <div className="flex gap-2.5">
                  <CounterButton
                    onClick={() => conversations > 0 && increment('conversations', -1)}
                  >
                    −
                  </CounterButton>
                  <CounterButton primary onClick={() => increment('conversations', 1)}>
                    +
                  </CounterButton>
                </div>
              </Card>

              <Card className="flex-1 p-3.5" radius="var(--radius-fp-tile)">
                <div
                  className="font-[var(--font-fp-display)] text-4xl leading-none mb-1"
                  style={{ color: 'var(--color-fp-ink)' }}
                >
                  {appointments}
                </div>
                <div
                  className="font-[var(--font-fp-mono)] text-[9.5px] tracking-[0.14em] uppercase mb-2.5"
                  style={{ color: 'var(--color-fp-ink-3)' }}
                >
                  Appointments
                </div>
                <div className="flex gap-2.5">
                  <CounterButton
                    onClick={() => appointments > 0 && increment('appointments', -1)}
                  >
                    −
                  </CounterButton>
                  <CounterButton primary onClick={() => increment('appointments', 1)}>
                    +
                  </CounterButton>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
