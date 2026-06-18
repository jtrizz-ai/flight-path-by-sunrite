'use client';

export type TabId = 'schedule' | 'tally' | 'chat';

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: 'schedule', label: 'SCHEDULE', icon: 'M3 4.5h18M3 9h18M8 2.5v4M16 2.5v4' },
  { id: 'tally', label: 'TALLY', icon: 'M5 20V9M10 20V4M15 20v-7M20 20V11' },
  { id: 'chat', label: 'CHAT', icon: 'M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z' },
];

export function TabBar({
  activeTab,
  onTabChange,
}: {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}) {
  return (
    <div
      className="flex items-center border-t px-2 py-2"
      style={{
        backgroundColor: 'rgba(8,8,10,0.92)',
        backdropFilter: 'blur(16px)',
        borderColor: 'var(--color-fp-line)',
      }}
    >
      {tabs.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex-1 flex flex-col items-center gap-1 py-1.5 transition-colors"
            style={{
              color: active ? 'var(--color-fp-accent-2)' : 'var(--color-fp-ink-3)',
            }}
          >
            <svg
              width="23"
              height="23"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={tab.icon} />
              {tab.id === 'schedule' && (
                <rect x="3" y="4.5" width="18" height="17" rx="3" fill="none" />
              )}
            </svg>
            <span className="font-[var(--font-fp-mono)] text-[9.5px] tracking-[0.14em]">
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
