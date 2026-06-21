import Link from "next/link";

type Source = { pageId: string; title: string; slug: string; snippet: string };

export default function SourceCard({ source }: { source: Source }) {
  return (
    <Link
      href={`/pages/${source.slug}`}
      className="mt-1 block rounded-[14px] px-3 py-2 transition"
      style={{
        backgroundColor: "var(--color-fp-card)",
        border: "1px solid var(--color-fp-line)",
      }}
    >
      <div
        className="font-[var(--font-fp-mono)] text-[10px] uppercase tracking-[0.2em]"
        style={{ color: "var(--color-fp-accent-2)" }}
      >
        Source
      </div>
      <div
        className="mt-1 font-semibold text-[13px]"
        style={{ color: "var(--color-fp-ink)" }}
      >
        {source.title}
      </div>
      <div
        className="mt-1 text-[12px] line-clamp-2"
        style={{ color: "var(--color-fp-ink-2)" }}
      >
        {source.snippet}
      </div>
    </Link>
  );
}
