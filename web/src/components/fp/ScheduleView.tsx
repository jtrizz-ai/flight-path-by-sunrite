'use client';

import Link from 'next/link';
import { ViewHeader, ViewBackground, Card } from './SharedUI';
import type { ContentPageSummary } from './FlightPathApp';

export function ScheduleView({ pages }: { pages: ContentPageSummary[] }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <ViewBackground imageName="schedule_bg.png" />

      <div className="absolute inset-0 overflow-y-auto px-5 py-6 md:px-8 md:py-8">
        <ViewHeader
          eyebrow="SunRite Solar"
          title="Schedule"
          subtitle={pages.length > 0 ? `Flight Path Program · ${pages.length} modules` : 'Flight Path Program'}
        />

        {pages.length === 0 ? (
          <Card className="max-w-3xl px-5 py-8 text-center">
            <div
              className="font-[var(--font-fp-mono)] text-[11px] tracking-[0.1em]"
              style={{ color: 'var(--color-fp-ink-3)' }}
            >
              No content published yet. Run the Notion crawler to populate this view.
            </div>
          </Card>
        ) : (
          <div className="flex flex-col gap-2.5 max-w-3xl">
            {pages.map((page, index) => (
              <Link key={page.slug} href={`/pages/${page.slug}`} className="group block">
                <Card className="flex items-center gap-3.5 px-4 py-4 transition-all duration-200 group-hover:brightness-125">
                  <div
                    className="font-[var(--font-fp-mono)] text-[11px] font-bold w-6 shrink-0"
                    style={{ color: 'var(--color-fp-accent-2)' }}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </div>

                  <div className="flex-1 text-left min-w-0 flex items-center gap-2">
                    {page.icon && <span className="text-lg shrink-0">{page.icon}</span>}
                    <div>
                      <div className="font-bold text-[14.5px] text-[var(--color-fp-ink)] leading-tight">
                        {page.title}
                      </div>
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
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
