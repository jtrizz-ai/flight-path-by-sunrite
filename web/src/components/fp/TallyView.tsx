'use client';

import { ViewHeader, ViewBackground, Card, CounterButton, ProgressBar } from './SharedUI';

export function TallyView({
  doors,
  conversations,
  appointments,
  onDoorsChange,
  onConversationsChange,
  onAppointmentsChange,
}: {
  doors: number;
  conversations: number;
  appointments: number;
  onDoorsChange: (value: number) => void;
  onConversationsChange: (value: number) => void;
  onAppointmentsChange: (value: number) => void;
}) {
  const doorsGoal = 40;
  const conversationsGoal = 15;
  const appointmentsGoal = 5;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <ViewBackground imageName="tally_bg.png" />

      <div className="absolute inset-0 overflow-y-auto px-5 py-6 md:px-8 md:py-8">
        <ViewHeader
          eyebrow="Field Tracker"
          title="Tally"
          subtitle="Today · tap to log your activity"
        />

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

          <ProgressBar progress={doors / doorsGoal} />

          <div className="flex gap-2.5">
            <CounterButton onClick={() => onDoorsChange(Math.max(0, doors - 1))}>
              −
            </CounterButton>
            <CounterButton primary onClick={() => onDoorsChange(doors + 1)}>
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
              <CounterButton onClick={() => onConversationsChange(Math.max(0, conversations - 1))}>
                −
              </CounterButton>
              <CounterButton primary onClick={() => onConversationsChange(conversations + 1)}>
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
              <CounterButton onClick={() => onAppointmentsChange(Math.max(0, appointments - 1))}>
                −
              </CounterButton>
              <CounterButton primary onClick={() => onAppointmentsChange(appointments + 1)}>
                +
              </CounterButton>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
