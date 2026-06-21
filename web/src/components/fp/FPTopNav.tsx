import Link from "next/link";
import { BrandMark } from "./BrandMark";

type Props = {
  email: string;
  role: string;
  active?: "library" | "admin";
  signOutAction: () => Promise<void>;
};

// FP-styled top navigation bar for pages outside the app shell
// (library, page detail, admin). Matches the AppHeader aesthetic:
// brand mark + mono labels on the left, nav links on the right.
export function FPTopNav({ email, role, active, signOutAction }: Props) {
  return (
    <nav
      className="sticky top-0 z-30 border-b"
      style={{
        backgroundColor: "rgba(6,6,7,0.6)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderColor: "var(--color-fp-line)",
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 h-14">
        {/* Brand */}
        <Link href="/flight-path" className="flex items-center gap-2.5">
          <span style={{ color: "var(--color-fp-accent-2)" }}>
            <BrandMark size={26} />
          </span>
          <div className="flex flex-col" style={{ gap: "1px" }}>
            <span
              className="font-[var(--font-fp-mono)] text-[12px] font-bold tracking-[0.1em]"
              style={{ color: "var(--color-fp-ink)" }}
            >
              SUNRITE SOLAR
            </span>
            <span
              className="font-[var(--font-fp-mono)] text-[9.5px] font-medium tracking-[0.15em]"
              style={{ color: "var(--color-fp-ink-3)" }}
            >
              FLIGHT PATH
            </span>
          </div>
        </Link>

        {/* Right nav */}
        <div className="flex items-center gap-5">
          <Link
            href="/pages"
            className="font-[var(--font-fp-mono)] text-[11px] tracking-[0.1em] uppercase transition-colors"
            style={{
              color:
                active === "library"
                  ? "var(--color-fp-accent-2)"
                  : "var(--color-fp-ink-3)",
            }}
          >
            Library
          </Link>
          {role === "Admin" && (
            <Link
              href="/admin"
              className="font-[var(--font-fp-mono)] text-[11px] tracking-[0.1em] uppercase transition-colors"
              style={{
                color:
                  active === "admin"
                    ? "var(--color-fp-accent-2)"
                    : "var(--color-fp-ink-3)",
              }}
            >
              Admin
            </Link>
          )}
          <form action={signOutAction}>
            <button
              type="submit"
              className="font-[var(--font-fp-mono)] text-[11px] tracking-[0.1em] uppercase transition-colors"
              style={{ color: "var(--color-fp-ink-3)" }}
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
