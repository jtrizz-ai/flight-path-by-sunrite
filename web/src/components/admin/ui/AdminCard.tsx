import type { ReactNode } from "react";

export function AdminCard({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-[18px] p-6 ${className}`}
      style={{
        backgroundColor: "var(--color-fp-card)",
        border: "1px solid var(--color-fp-card-line)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
