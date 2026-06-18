'use client';

import { BrandMark } from './BrandMark';

export function AppHeader({
  userName,
  onHomeClick,
  onMenuClick,
}: {
  userName: string;
  onHomeClick: () => void;
  onMenuClick: () => void;
}) {
  return (
    <div
      className="flex items-center justify-between gap-3 px-4 md:px-6 py-2 md:py-3 border-b"
      style={{
        backgroundColor: 'rgba(6,6,7,0.6)',
        backdropFilter: 'blur(14px)',
        borderColor: 'var(--color-fp-line)',
      }}
    >
      {/* Brand → Home */}
      <button
        onClick={onHomeClick}
        className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity"
      >
        <BrandMark size={26} className="text-[var(--color-fp-accent-2)]" />
        <div className="text-left">
          <div className="font-[var(--font-fp-mono)] font-bold text-[10px] md:text-[12px] tracking-[0.08em] uppercase leading-tight text-[var(--color-fp-ink)]">
            SUNRITE SOLAR
          </div>
          <div
            className="font-[var(--font-fp-mono)] font-medium text-[8px] md:text-[9.5px] tracking-[0.16em] uppercase"
            style={{ color: 'var(--color-fp-ink-3)' }}
          >
            FLIGHT PATH
          </div>
        </div>
      </button>

      {/* Welcome + hamburger */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <div
            className="font-[var(--font-fp-mono)] text-[11px] tracking-[0.04em]"
            style={{ color: 'var(--color-fp-ink-2)' }}
          >
            Welcome
          </div>
          <div className="font-[var(--font-fp-mono)] font-bold text-[11px] tracking-[0.02em] text-[var(--color-fp-ink)]">
            {userName}
          </div>
        </div>

        {/* Hamburger */}
        <button
          onClick={onMenuClick}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
          style={{
            backgroundColor: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--color-fp-line)',
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="text-[var(--color-fp-ink)]"
          >
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
