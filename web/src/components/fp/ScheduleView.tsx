'use client';

import { ViewHeader, ViewBackground, Card } from './SharedUI';

const modules = [
  { id: '01', title: 'Flight Path Schedule', subtitle: 'Onboarding · Week 1' },
  { id: '02', title: 'RepCard Territory Management', subtitle: 'Tools · Door to Door' },
  { id: '03', title: 'The Door Pitch', subtitle: 'Sales · Script' },
  { id: '04', title: 'Recommended Reading & Content', subtitle: 'Resources · Library' },
];

export function ScheduleView() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <ViewBackground imageName="schedule_bg.png" />

      <div className="absolute inset-0 overflow-y-auto px-5 py-6 md:px-8 md:py-8">
        <ViewHeader
          eyebrow="SunRite Solar"
          title="Schedule"
          subtitle="Flight Path Program · 4 modules"
        />

        <div className="flex flex-col gap-2.5 max-w-3xl">
          {modules.map((module) => (
            <button
              key={module.id}
              className="group w-full hover:opacity-90 transition-opacity"
            >
              <Card className="flex items-center gap-3.5 px-4 py-4">
                <div
                  className="font-[var(--font-fp-mono)] text-[11px] font-bold w-6 shrink-0"
                  style={{ color: 'var(--color-fp-accent-2)' }}
                >
                  {module.id}
                </div>

                <div className="flex-1 text-left min-w-0">
                  <div className="font-bold text-[14.5px] text-[var(--color-fp-ink)] leading-tight">
                    {module.title}
                  </div>
                  <div
                    className="font-[var(--font-fp-mono)] text-[10px] tracking-[0.12em] uppercase mt-1"
                    style={{ color: 'var(--color-fp-ink-3)' }}
                  >
                    {module.subtitle}
                  </div>
                </div>

                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0"
                  style={{ color: 'var(--color-fp-ink-3)' }}
                >
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </Card>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
