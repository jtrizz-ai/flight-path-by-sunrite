import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FPTopNav } from "@/components/fp/FPTopNav";

async function handleSignOut() {
  "use server";
  await signOut({ redirectTo: "/" });
}

// ─────────────────────────────────────────────────────────────────────────
// Flight Path Program — the overview / "what is this" landing page.
//
// Introduces the four pillars of the program (Schedule, Tally, Door Pitch,
// Levels) and links the user deeper into each one. Links to in-app pages are
// highlighted in the SunRite accent orange so they stand out against the
// dark editorial background.
// ─────────────────────────────────────────────────────────────────────────

type Pillar = {
  index: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  icon: string;
};

const PILLARS: Pillar[] = [
  {
    index: "01",
    title: "Schedule",
    description:
      "Your onboarding roadmap and 40-day work plan. Track milestones from your first knock through your first closed appointment — see exactly what to do each week and when.",
    href: "/flight-path",
    cta: "Open Schedule",
    icon: "M3 4.5h18M3 9h18M8 2.5v4M16 2.5v4",
  },
  {
    index: "02",
    title: "Tally",
    description:
      "Count every door knocked, every conversation had, and every appointment set. Your daily numbers feed directly into your milestones and badges — track them in real time.",
    href: "/flight-path",
    cta: "Open Tally",
    icon: "M5 20V9M10 20V4M15 20v-7M20 20V11",
  },
  {
    index: "03",
    title: "Door Pitch",
    description:
      "The field script and tonality system. Learn the intro, the offer, how to handle objections, and the appointment funnel — with inflection arrows and delivery tags for every line.",
    href: "/pages",
    cta: "Read the Script",
    icon: "M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z",
  },
  {
    index: "04",
    title: "Levels",
    description:
      "Three earned tiers — High Flyer, Altitude Club, Stratosphere Club. Your rank is set by the closed contracts from your leads. Climb the tiers, raise your rate, unlock club gear.",
    href: "/levels",
    cta: "See the Tiers",
    icon: "M12 2L2 7v10l10 5 10-5V7L12 2zM12 22V12M2 7l10 5 10-5",
  },
];

export default async function ProgramPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-fp-bg)" }}>
      <FPTopNav
        email={session.user.email ?? ""}
        role={session.user.role ?? "Sales"}
        active="library"
        signOutAction={handleSignOut}
      />

      {/* Cinematic background */}
      <div className="relative">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="/images/home_scene.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(6,6,7,0.82) 0%, rgba(6,6,7,0.70) 40%, rgba(6,6,7,0.90) 100%)",
            }}
          />
        </div>
        <div className="grain-overlay" />

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-5xl px-5 py-14 md:py-20">
          {/* Hero */}
          <div className="mb-12">
            <div
              className="font-[var(--font-fp-mono)] text-[10px] tracking-[0.34em] uppercase mb-2"
              style={{ color: "var(--color-fp-accent-2)" }}
            >
              SUNRITE SOLAR
            </div>
            <h1
              className="font-[var(--font-fp-display)] text-5xl md:text-7xl uppercase leading-[0.9] tracking-[0.01em]"
              style={{ color: "var(--color-fp-ink)" }}
            >
              Flight Path
              <br />
              Program
            </h1>
          </div>

          {/* Intro paragraph */}
          <div className="max-w-2xl mb-14">
            <p
              className="font-[var(--font-fp-sans)] text-[15px] md:text-[17px] leading-[1.7]"
              style={{ color: "var(--color-fp-ink-2)" }}
            >
              The Flight Path Program is SunRite Solar&apos;s field sales
              development system. It takes a new Field Marketer from their first
              door knock to a full pipeline of closed contracts — with a guided
              schedule, real-time tally tracking, a proven door pitch, and an
              earned tier system that rewards the quality leads you put into the
              pipeline.
            </p>
            <p
              className="font-[var(--font-fp-sans)] text-[15px] md:text-[17px] leading-[1.7] mt-4"
              style={{ color: "var(--color-fp-ink-2)" }}
            >
              Everything below is a part of your flight path. Tap any pillar to
              jump straight into it.
            </p>
          </div>

          {/* Pillar cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-14">
            {PILLARS.map((pillar) => (
              <Link
                key={pillar.index}
                href={pillar.href}
                className="block group"
              >
                <div
                  className="h-full rounded-[var(--radius-fp-card)] p-6 transition-all duration-200 group-hover:brightness-125"
                  style={{
                    backgroundColor: "var(--color-fp-card)",
                    border: "1px solid var(--color-fp-card-line)",
                  }}
                >
                  {/* Index + icon */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className="font-[var(--font-fp-mono)] text-[11px] font-bold tracking-[0.18em]"
                      style={{ color: "var(--color-fp-accent-2)" }}
                    >
                      {pillar.index}
                    </span>
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ color: "var(--color-fp-accent)" }}
                    >
                      <path d={pillar.icon} />
                    </svg>
                  </div>

                  {/* Title */}
                  <h3
                    className="font-[var(--font-fp-display)] text-2xl md:text-3xl uppercase leading-[0.95] mb-3"
                    style={{ color: "var(--color-fp-ink)" }}
                  >
                    {pillar.title}
                  </h3>

                  {/* Description */}
                  <p
                    className="font-[var(--font-fp-sans)] text-[13px] leading-[1.6] mb-5"
                    style={{ color: "var(--color-fp-ink-2)" }}
                  >
                    {pillar.description}
                  </p>

                  {/* CTA link — orange highlight */}
                  <span
                    className="inline-flex items-center gap-1.5 font-[var(--font-fp-mono)] text-[11px] font-bold uppercase tracking-[0.12em] transition-colors"
                    style={{ color: "var(--color-fp-accent)" }}
                  >
                    {pillar.cta}
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* The breakdown — what the program is, step by step */}
          <div className="mb-14">
            <div
              className="font-[var(--font-fp-mono)] text-[10px] tracking-[0.3em] uppercase mb-4"
              style={{ color: "var(--color-fp-accent-2)" }}
            >
              THE BREAKDOWN
            </div>
            <div className="space-y-5">
              <BreakdownRow
                label="Onboarding"
                text="Start with the Schedule — a guided set of milestones from Week 1 through your first appointments."
                links={[{ text: "Schedule", href: "/flight-path" }]}
              />
              <BreakdownRow
                label="Daily Activity"
                text="Every door you knock, conversation you start, and appointment you set gets counted in the Tally."
                links={[{ text: "Tally", href: "/flight-path" }]}
              />
              <BreakdownRow
                label="The Pitch"
                text="Learn the field script — the intro, the offer, objection handling, and the appointment funnel that turns a knock into a sit."
                links={[{ text: "Door Pitch", href: "/pages" }]}
              />
              <BreakdownRow
                label="The Tiers"
                text="Closed contracts from your leads earn you rank: High Flyer, Altitude Club, and Stratosphere Club — each with a higher rate per watt."
                links={[{ text: "Levels", href: "/levels" }]}
              />
              <BreakdownRow
                label="The Library"
                text="Every published Notion page — training docs, resources, and reference material — lives in one searchable library."
                links={[{ text: "Library", href: "/pages" }]}
              />
            </div>
          </div>

          {/* Footer */}
          <div
            className="pt-8 border-t"
            style={{ borderColor: "var(--color-fp-line)" }}
          >
            <Link
              href="/flight-path"
              className="inline-flex items-center gap-2 font-[var(--font-fp-mono)] text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ color: "var(--color-fp-accent)" }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M11 18l-6-6 6-6" />
              </svg>
              Back to Flight Path
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function BreakdownRow({
  label,
  text,
  links,
}: {
  label: string;
  text: string;
  links: { text: string; href: string }[];
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-6">
      <div className="sm:w-40 shrink-0">
        <span
          className="font-[var(--font-fp-mono)] text-[10px] font-bold tracking-[0.16em] uppercase"
          style={{ color: "var(--color-fp-ink-3)" }}
        >
          {label}
        </span>
      </div>
      <div className="flex-1">
        <p
          className="font-[var(--font-fp-sans)] text-[14px] leading-[1.65]"
          style={{ color: "var(--color-fp-ink-2)" }}
        >
          {text}{" "}
          {links.map((link, i) => (
            <Link
              key={link.text}
              href={link.href}
              className="font-[var(--font-fp-sans)] font-bold underline-offset-2 hover:underline"
              style={{ color: "var(--color-fp-accent)" }}
            >
              {link.text}
              {i < links.length - 1 ? ", " : ""}
            </Link>
          ))}
        </p>
      </div>
    </div>
  );
}
