'use client';

import Link from 'next/link';
import { BrandMark } from './BrandMark';
import type { TabId } from './TabBar';

export function SideDrawer({
  isOpen,
  userName,
  userEmail,
  userInitials,
  onClose,
  onNavigate,
}: {
  isOpen: boolean;
  userName: string;
  userEmail: string;
  userInitials: string;
  onClose: () => void;
  onNavigate: (tab: 'home' | TabId) => void;
}) {
  if (!isOpen) return null;

  const navLinks: { title: string; icon?: string; useBrand?: boolean; tab?: 'home' | TabId }[] = [
    { title: 'Home', icon: 'M3 11l9-8 9 8M5 9.5V21h14V9.5', tab: 'home' },
    { title: 'Schedule', icon: 'M3 4.5h18M3 9h18M8 2.5v4M16 2.5v4', tab: 'schedule' },
    { title: 'Tally', icon: 'M5 20V9M10 20V4M15 20v-7M20 20V11', tab: 'tally' },
    { title: 'Chat', icon: 'M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z', tab: 'chat' },
  ];

  const extraLinks: { title: string; icon?: string; useBrand?: boolean }[] = [
    { title: 'Flight Path Program', useBrand: true },
    { title: 'Profile', icon: 'M4 21c0-4 4-6 8-6s8 2 8 6' },
    { title: 'Settings', icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z' },
  ];

  return (
    <>
      {/* Scrim */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 bottom-0 w-[76%] max-w-[300px] z-50 flex flex-col p-6 overflow-y-auto"
        style={{
          backgroundColor: 'var(--color-fp-bg-2)',
          borderLeft: '1px solid var(--color-fp-line)',
        }}
      >
        {/* User block */}
        <div className="flex items-center gap-3 pb-5 mb-3.5 border-b" style={{ borderColor: 'var(--color-fp-line)' }}>
          <div
            className="w-[46px] h-[46px] rounded-full flex items-center justify-center font-[var(--font-fp-display)] text-lg text-white"
            style={{
              background: 'linear-gradient(135deg, var(--color-fp-accent), var(--color-fp-accent-2))',
            }}
          >
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-[15px] text-[var(--color-fp-ink)] truncate">{userName}</div>
            <div
              className="font-[var(--font-fp-mono)] text-[10px] truncate"
              style={{ color: 'var(--color-fp-ink-3)' }}
            >
              {userEmail}
            </div>
          </div>
        </div>

        {/* Nav links */}
        <div className="flex flex-col gap-0.5 mb-3">
          {navLinks.map((link) => (
            <button
              key={link.title}
              onClick={() => {
                if (link.tab) onNavigate(link.tab);
                onClose();
              }}
              className="flex items-center gap-3 px-2.5 py-3 rounded-xl transition-colors"
              style={{ color: 'var(--color-fp-ink-2)' }}
            >
              {link.icon && (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-fp-ink-3)' }}>
                  <path d={link.icon} />
                  {link.title === 'Schedule' && <rect x="3" y="4.5" width="18" height="17" rx="3" fill="none" />}
                  {link.title === 'Profile' && <circle cx="12" cy="8" r="4" fill="none" />}
                </svg>
              )}
              <span className="font-semibold text-[14px]">{link.title}</span>
            </button>
          ))}
        </div>

        {/* Separator */}
        <div className="h-px mx-1 my-3" style={{ backgroundColor: 'var(--color-fp-line)' }} />

        {/* Extra links */}
        <div className="flex flex-col gap-0.5">
          {extraLinks.map((link) => {
            const inner = (
              <>
                {link.useBrand ? (
                  <BrandMark size={19} className="text-[var(--color-fp-ink-3)]" />
                ) : link.icon ? (
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-fp-ink-3)' }}>
                    <path d={link.icon} />
                    {link.title === 'Settings' && (
                      <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 2.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H7a1.6 1.6 0 0 0 1-1.5V1a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V7a1.6 1.6 0 0 0 1.5 1H23a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
                    )}
                  </svg>
                ) : null}
                <span className="font-semibold text-[14px]">{link.title}</span>
              </>
            );

            const cls =
              'flex items-center gap-3 px-2.5 py-3 rounded-xl transition-colors';
            const style = { color: 'var(--color-fp-ink-2)' };

            // Profile and Flight Path Program are real Next.js routes; render as Link.
            if (link.title === 'Profile') {
              return (
                <Link key={link.title} href="/profile" onClick={onClose} className={cls} style={style}>
                  {inner}
                </Link>
              );
            }
            if (link.title === 'Flight Path Program') {
              return (
                <Link key={link.title} href="/pages" onClick={onClose} className={cls} style={style}>
                  {inner}
                </Link>
              );
            }

            return (
              <button key={link.title} className={cls} style={style}>
                {inner}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-6">
          <div
            className="font-[var(--font-fp-mono)] text-[9.5px] tracking-[0.14em] uppercase text-center"
            style={{ color: 'var(--color-fp-ink-3)' }}
          >
            SUNRITE SOLAR · FLIGHT PATH v1.0
          </div>
        </div>
      </div>
    </>
  );
}
