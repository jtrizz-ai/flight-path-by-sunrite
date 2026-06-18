import { ReactNode } from 'react';

// View header with eyebrow, big display title, subtitle
export function ViewHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-4">
      <div
        className="font-[var(--font-fp-mono)] text-[10px] tracking-[0.34em] uppercase mb-2"
        style={{ color: 'var(--color-fp-ink-3)' }}
      >
        {eyebrow}
      </div>
      <h1
        className="font-[var(--font-fp-display)] text-5xl md:text-6xl uppercase leading-[0.92] tracking-[0.01em]"
        style={{ color: 'var(--color-fp-ink)' }}
      >
        {title}
      </h1>
      <p
        className="font-[var(--font-fp-mono)] text-[11px] tracking-[0.06em] mt-2"
        style={{ color: 'var(--color-fp-ink-2)' }}
      >
        {subtitle}
      </p>
    </div>
  );
}

// Card surface wrapper
export function Card({
  children,
  className = '',
  radius = 'var(--radius-fp-card)',
}: {
  children: ReactNode;
  className?: string;
  radius?: string;
}) {
  return (
    <div
      className={className}
      style={{
        backgroundColor: 'var(--color-fp-card)',
        border: '1px solid var(--color-fp-card-line)',
        borderRadius: radius,
      }}
    >
      {children}
    </div>
  );
}

// Background image + scrim for Schedule/Tally views
export function ViewBackground({ imageName }: { imageName: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'var(--color-fp-bg)' }}
      />
      <img
        src={`/images/${imageName}`}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(6,6,7,0.80) 0%, rgba(6,6,7,0.72) 38%, rgba(6,6,7,0.88) 100%)',
        }}
      />
    </div>
  );
}

// Counter button for Tally view
export function CounterButton({
  children,
  primary = false,
  onClick,
}: {
  children: ReactNode;
  primary?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 h-[46px] rounded-[var(--radius-fp-button)] font-[var(--font-fp-mono)] text-[13px] font-bold tracking-[0.1em] uppercase transition-colors duration-200"
      style={{
        backgroundColor: primary ? 'var(--color-fp-accent)' : 'rgba(255,255,255,0.03)',
        color: primary ? '#fff' : 'var(--color-fp-ink)',
        border: primary
          ? '1px solid var(--color-fp-accent)'
          : '1px solid var(--color-fp-line)',
      }}
    >
      {children}
    </button>
  );
}

// Progress bar
export function ProgressBar({ progress }: { progress: number }) {
  return (
    <div
      className="h-[6px] rounded-[var(--radius-fp-pill)] overflow-hidden mb-4"
      style={{ backgroundColor: 'rgba(255,255,255,0.10)' }}
    >
      <div
        className="h-full rounded-[var(--radius-fp-pill)] transition-all duration-400 ease-out"
        style={{
          width: `${Math.min(100, progress * 100)}%`,
          background: 'linear-gradient(90deg, var(--color-fp-accent), var(--color-fp-accent-2))',
        }}
      />
    </div>
  );
}
