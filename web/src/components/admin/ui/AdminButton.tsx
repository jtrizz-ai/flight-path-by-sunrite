import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-[var(--font-fp-mono)] font-bold tracking-[0.1em] uppercase transition-opacity focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed";

const sizes: Record<Size, string> = {
  sm: "px-4 py-1.5 text-[10px]",
  md: "px-5 py-2 text-[11px]",
};

const variants: Record<Variant, React.CSSProperties> = {
  primary: { backgroundColor: "var(--color-fp-accent)", color: "#fff" },
  secondary: {
    border: "1px solid var(--color-fp-line)",
    color: "var(--color-fp-ink-2)",
    backgroundColor: "transparent",
  },
  danger: {
    backgroundColor: "rgba(232,71,42,0.12)",
    border: "1px solid rgba(232,71,42,0.4)",
    color: "var(--color-fp-accent)",
  },
  ghost: { color: "var(--color-fp-ink-3)", backgroundColor: "transparent" },
};

export function AdminButton({
  children,
  variant = "primary",
  size = "md",
  className = "",
  style,
  ...rest
}: {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`${base} ${sizes[size]} ${className}`}
      style={{ ...variants[variant], ...style }}
      {...rest}
    >
      {children}
    </button>
  );
}
