'use client';

import { useState, useEffect } from 'react';
import { LaunchLights } from './LaunchLights';

type EarnedBadge = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_quarterly: boolean;
  quarter: number | null;
  year: number | null;
  awarded_at: string;
};

export function HomeView({ userName }: { userName: string }) {
  const [badges, setBadges] = useState<EarnedBadge[]>([]);

  useEffect(() => {
    fetch('/api/me/badges', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setBadges(d.badges || []))
      .catch(() => {});
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0" style={{ backgroundColor: 'var(--color-fp-bg)' }} />

      {/* Cinematic image */}
      <img
        src="/images/home_scene.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Scrims - radial + linear gradients */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(90% 60% at 50% 38%, rgba(6,6,7,0) 40%, rgba(6,6,7,0.5) 100%),
            linear-gradient(to bottom, rgba(6,6,7,0.45) 0%, rgba(6,6,7,0) 24%, rgba(6,6,7,0) 62%, rgba(6,6,7,0.78) 100%)
          `,
        }}
      />

      {/* Animated runway lights */}
      <LaunchLights />

      {/* Hero content */}
      <div className="absolute inset-0 flex flex-col items-center justify-between px-5 py-10 md:py-12 pointer-events-none">
        <div className="text-center">
          <div
            className="font-[var(--font-fp-mono)] text-[11px] tracking-[0.42em] uppercase mb-3"
            style={{ color: 'var(--color-fp-ink-2)' }}
          >
            CLEARED FOR DEPARTURE
          </div>
          <h1
            className="font-[var(--font-fp-display)] text-5xl md:text-7xl lg:text-8xl uppercase leading-[0.9] tracking-[0.02em]"
            style={{
              color: 'var(--color-fp-ink)',
              textShadow: '0 6px 44px rgba(0,0,0,0.9)',
            }}
          >
            FLIGHT PATH
          </h1>
        </div>

        {/* Badge display — appears between wordmark and welcome line */}
        {badges.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-md pointer-events-auto">
            {badges.map((badge) => (
              <div
                key={badge.id + (badge.quarter ?? '') + (badge.year ?? '')}
                className="flex flex-col items-center rounded-[14px] px-4 py-2.5"
                style={{
                  backgroundColor: 'rgba(232,71,42,0.08)',
                  border: '1px solid rgba(232,71,42,0.3)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }}
              >
                <div
                  className="font-[var(--font-fp-display)] text-[13px] uppercase leading-tight tracking-[0.02em]"
                  style={{ color: 'var(--color-fp-ink)' }}
                >
                  {badge.name}
                </div>
                {badge.is_quarterly && (badge.quarter || badge.year) && (
                  <div
                    className="font-[var(--font-fp-mono)] text-[8px] tracking-[0.15em] uppercase mt-0.5"
                    style={{ color: 'var(--color-fp-accent-2)' }}
                  >
                    {badge.quarter ? `Q${badge.quarter}` : ''} {badge.year ?? ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div
          className="font-[var(--font-fp-mono)] text-[11px] tracking-[0.14em] uppercase text-center max-w-md"
          style={{ color: 'var(--color-fp-ink-2)' }}
        >
          Welcome back, {userName} — ready for departure
        </div>
      </div>
    </div>
  );
}
