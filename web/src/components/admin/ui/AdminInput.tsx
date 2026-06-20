import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from "react";

export const adminFieldStyle: React.CSSProperties = {
  backgroundColor: "rgba(255,255,255,0.04)",
  border: "1px solid var(--color-fp-line)",
  borderRadius: "14px",
  color: "var(--color-fp-ink)",
};

export function FieldLabel({
  children,
  hint,
}: {
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <span
      className="block pb-1.5 font-[var(--font-fp-mono)] text-[10px] tracking-[0.2em] uppercase"
      style={{ color: "var(--color-fp-ink-3)" }}
    >
      {children}
      {hint && (
        <span
          className="ml-1 normal-case tracking-normal"
          style={{ color: "var(--color-fp-ink-3)" }}
        >
          {hint}
        </span>
      )}
    </span>
  );
}

export function AdminInput(
  props: InputHTMLAttributes<HTMLInputElement>
) {
  const { className = "", style, ...rest } = props;
  return (
    <input
      className={`w-full px-4 py-2.5 font-mono text-[13px] focus:outline-none ${className}`}
      style={{ ...adminFieldStyle, ...style }}
      {...rest}
    />
  );
}

export function AdminSelect(
  props: SelectHTMLAttributes<HTMLSelectElement>
) {
  const { className = "", style, children, ...rest } = props;
  return (
    <select
      className={`px-4 py-2.5 font-[var(--font-fp-sans)] text-[13px] focus:outline-none ${className}`}
      style={{ ...adminFieldStyle, ...style }}
      {...rest}
    >
      {children}
    </select>
  );
}

export function AdminTextarea(
  props: TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  const { className = "", style, ...rest } = props;
  return (
    <textarea
      className={`w-full px-4 py-2.5 font-[var(--font-fp-sans)] text-[13px] focus:outline-none ${className}`}
      style={{ ...adminFieldStyle, ...style }}
      {...rest}
    />
  );
}
