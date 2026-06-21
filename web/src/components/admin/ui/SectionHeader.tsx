import type { ReactNode } from "react";

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div>
        <h2
          className="font-[var(--font-fp-sans)] text-[16px] font-bold mb-1"
          style={{ color: "var(--color-fp-ink)" }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className="font-[var(--font-fp-sans)] text-[12px]"
            style={{ color: "var(--color-fp-ink-3)" }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      className="mb-4 rounded-[10px] px-4 py-3 font-[var(--font-fp-sans)] text-[13px]"
      style={{
        backgroundColor: "rgba(232,71,42,0.08)",
        border: "1px solid rgba(232,71,42,0.3)",
        color: "var(--color-fp-accent)",
      }}
    >
      {message}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div
      className="text-center py-8 font-[var(--font-fp-mono)] text-[11px]"
      style={{ color: "var(--color-fp-ink-3)" }}
    >
      {message}
    </div>
  );
}
