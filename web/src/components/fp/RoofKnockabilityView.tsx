'use client';

// Roof Knockability — SunRite field guide for approved vs. not-approved roof types.
// Content sourced from Roof_Knockability_Approved_Not_Approved_CLEAR_IMAGES_v2.pdf

import Link from 'next/link';

// ── Data ─────────────────────────────────────────────────────────────────────

type RoofType = {
  name: string;
  description: string;
  fieldTip: string;
  svgPath: string; // single SVG path for the icon
};

const APPROVED: RoofType[] = [
  {
    name: 'Architectural Shingle',
    description:
      'Thick, layered shingles with a dimensional, textured look. The most common roof type in the US.',
    fieldTip: "Overlapping layers give it a "3D" texture — easy to spot from the street.",
    svgPath: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  },
  {
    name: 'Three Tab Shingle',
    description:
      'Flat, uniform shingles cut into three equal tabs per strip. Thinner and more uniform than architectural.',
    fieldTip: 'Very flat, evenly spaced lines across the roof. Common on homes 20–30+ years old.',
    svgPath: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10',
  },
  {
    name: 'Standing Seam Roof',
    description:
      'Metal roof with raised vertical seams running from ridge to eave. Highly compatible with solar clamps.',
    fieldTip:
      'Shiny metal panels with visible raised lines running top-to-bottom. Strong solar candidate.',
    svgPath: 'M3 3h18v18H3zM8 3v18M13 3v18M18 3v18',
  },
  {
    name: 'Corrugated Metal',
    description:
      'Wavy or ridged metal sheets. Common on barns, older homes, and agricultural properties.',
    fieldTip: 'Wavy ripple pattern across metal panels. Approved — note it in your pitch.',
    svgPath: 'M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0M3 6c2-4 4-4 6 0s4 4 6 0 4-4 6 0M3 18c2-4 4-4 6 0s4 4 6 0 4-4 6 0',
  },
  {
    name: 'Rolled Roof / TPO',
    description:
      'Smooth membrane material on flat or low-slope roofs. White or light grey is common for TPO.',
    fieldTip:
      'Flat roof with a smooth membrane. Usually white or light grey. Solar-ready with ballast mounts.',
    svgPath: 'M3 6h18v12H3z',
  },
];

const NOT_APPROVED: RoofType[] = [
  {
    name: 'Foam Roofing',
    description:
      'Thick spray-foam coating, typically white or off-white. Cannot support standard solar panel mounting hardware.',
    fieldTip: 'Looks like thick white foam sprayed over the roof surface. Skip this house.',
    svgPath: 'M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z',
  },
  {
    name: 'Wood Shake',
    description:
      'Cedar or wood shingles with an irregular, rough texture. Fire risk and structural mounting issues.',
    fieldTip: 'Rough, uneven wooden shingles — looks natural/rustic. Do not knock this roof.',
    svgPath: 'M17 8C8 10 5.9 16.17 3.82 19.21M6.3 19.86A8.01 8.01 0 0 0 21 12c-3.68 0-7 2-8.68 5M21 12a9 9 0 1 1-18 0',
  },
  {
    name: 'Slate Roof',
    description:
      'Heavy natural stone tiles. Extremely fragile — drilling will crack the tiles. Not compatible.',
    fieldTip:
      'Looks like flat stone or thick grey/blue tiles in neat rows. Very heavy. Walk away.',
    svgPath: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  },
  {
    name: 'Tar & Gravel Roofing',
    description:
      'Flat roof with black tar and loose gravel surface. Not compatible with standard solar mounts.',
    fieldTip: 'Flat black roof with visible gravel layer. Rough gravelly texture. Skip it.',
    svgPath: 'M3 6h18v12H3zM7 10h.01M11 10h.01M15 10h.01M7 14h.01M11 14h.01M15 14h.01',
  },
];

const GREEN = '#34C759';

// ── Component ─────────────────────────────────────────────────────────────────

export function RoofKnockabilityView() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(120% 120% at 70% -10%, var(--color-fp-bg-2, #0c0c10) 0%, var(--color-fp-bg, #060607) 55%)',
        color: 'var(--color-fp-ink)',
        fontFamily: 'var(--font-fp-sans, sans-serif)',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px 80px' }}>

        {/* Back nav */}
        <div style={{ paddingTop: 24, paddingBottom: 8 }}>
          <Link
            href="/"
            style={{
              fontFamily: 'var(--font-fp-mono)',
              fontSize: 11,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--color-fp-ink-3)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            ← Back
          </Link>
        </div>

        {/* Hero */}
        <div style={{ paddingTop: 40, paddingBottom: 48, borderBottom: '1px solid var(--color-fp-line)' }}>
          <div style={{
            fontFamily: 'var(--font-fp-mono)',
            fontSize: 10,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: 'var(--color-fp-ink-3)',
            marginBottom: 14,
          }}>
            SUNRITE FIELD GUIDE
          </div>
          <h1 style={{
            fontFamily: 'var(--font-fp-display)',
            fontWeight: 900,
            fontSize: 'clamp(64px, 14vw, 120px)',
            lineHeight: 0.88,
            letterSpacing: '-0.01em',
            textTransform: 'uppercase',
            color: 'var(--color-fp-ink)',
            margin: 0,
          }}>
            ROOF<br />KNOCK-<br />ABILITY
          </h1>
          <div style={{
            fontFamily: 'var(--font-fp-mono)',
            fontSize: 11,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--color-fp-ink-3)',
            marginTop: 18,
            marginBottom: 20,
          }}>
            KNOW YOUR ROOFS BEFORE YOU KNOCK
          </div>
          <p style={{
            fontFamily: 'var(--font-fp-sans)',
            fontSize: 16,
            lineHeight: 1.6,
            color: 'var(--color-fp-ink-2)',
            maxWidth: 560,
            margin: 0,
          }}>
            Not every roof qualifies for solar. Before you knock, scan the roof. If it's on the{' '}
            <span style={{ color: 'var(--color-fp-accent)', fontWeight: 600 }}>NOT APPROVED</span>{' '}
            list, move to the next house. You'll save your time and the homeowner's.
          </p>
        </div>

        {/* Quick Reference */}
        <SectionKicker>Quick Reference</SectionKicker>
        <h2 style={h2Style}>AT A GLANCE</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20, marginBottom: 56 }}>
          <QuickRefCol approved />
          <QuickRefCol approved={false} />
        </div>

        {/* Approved */}
        <div style={{ borderTop: '1px solid var(--color-fp-line)', paddingTop: 48 }}>
          <SectionKicker>Approved Roof Types</SectionKicker>
          <h2 style={h2Style}>KNOCK THESE</h2>
          <p style={ledeStyle}>Five roof types that qualify for solar installation.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
            {APPROVED.map((roof) => (
              <RoofCard key={roof.name} roof={roof} approved />
            ))}
          </div>
        </div>

        {/* Not Approved */}
        <div style={{ borderTop: '1px solid var(--color-fp-line)', paddingTop: 48, marginTop: 56 }}>
          <SectionKicker>Not Approved Roof Types</SectionKicker>
          <h2 style={h2Style}>SKIP THESE</h2>
          <p style={ledeStyle}>Four roof types that do NOT qualify. Move to the next house.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
            {NOT_APPROVED.map((roof) => (
              <RoofCard key={roof.name} roof={roof} approved={false} />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 64,
          paddingTop: 24,
          borderTop: '1px solid var(--color-fp-line)',
          fontFamily: 'var(--font-fp-mono)',
          fontSize: 9.5,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--color-fp-ink-3)',
        }}>
          <span>SUNRITE SOLAR — ROOF GUIDE</span>
          <span>KNOW BEFORE YOU KNOCK</span>
        </div>

      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionKicker({ children }: { children: string }) {
  return (
    <div style={{
      fontFamily: 'var(--font-fp-mono)',
      fontSize: 11,
      letterSpacing: '0.34em',
      textTransform: 'uppercase',
      color: 'var(--color-fp-accent-2)',
      marginBottom: 10,
      marginTop: 0,
    }}>
      {children}
    </div>
  );
}

function QuickRefCol({ approved }: { approved: boolean }) {
  const items = approved ? APPROVED : NOT_APPROVED;
  const color = approved ? GREEN : 'var(--color-fp-accent)';
  const label = approved ? 'APPROVED' : 'NOT APPROVED';
  const icon = approved ? '✓' : '✕';

  return (
    <div style={{
      border: `1px solid ${color}33`,
      borderRadius: 10,
      padding: 16,
      backgroundColor: `${color}0D`,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginBottom: 14,
        fontFamily: 'var(--font-fp-mono)',
        fontSize: 10,
        letterSpacing: '0.16em',
        fontWeight: 700,
        color,
      }}>
        <span style={{ fontSize: 12 }}>{icon}</span>
        {label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((r) => (
          <div key={r.name} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{
              display: 'inline-block',
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: `${color}66`,
              marginTop: 5,
              flexShrink: 0,
            }} />
            <span style={{
              fontFamily: 'var(--font-fp-mono)',
              fontSize: 11,
              color: 'var(--color-fp-ink-2)',
            }}>
              {r.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoofCard({ roof, approved }: { roof: RoofType; approved: boolean }) {
  const statusColor = approved ? GREEN : 'var(--color-fp-accent)';
  const statusLabel = approved ? 'APPROVED' : 'NOT APPROVED';

  return (
    <div style={{
      border: '1px solid var(--color-fp-line)',
      borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.02)',
      overflow: 'hidden',
    }}>
      {/* Card top */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '16px 20px' }}>
        {/* Icon */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-fp-ink-3)"
          strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, marginTop: 2 }}>
          <path d={roof.svgPath} />
        </svg>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name + badge row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
            <span style={{
              fontFamily: 'var(--font-fp-sans)',
              fontWeight: 700,
              fontSize: 15,
              color: 'var(--color-fp-ink)',
            }}>
              {roof.name}
            </span>
            <span style={{
              fontFamily: 'var(--font-fp-mono)',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: statusColor,
              border: `1px solid ${statusColor}4D`,
              backgroundColor: `${statusColor}1A`,
              borderRadius: 999,
              padding: '3px 10px',
              whiteSpace: 'nowrap',
            }}>
              {statusLabel}
            </span>
          </div>
          <p style={{
            fontFamily: 'var(--font-fp-sans)',
            fontSize: 13,
            lineHeight: 1.55,
            color: 'var(--color-fp-ink-2)',
            margin: 0,
          }}>
            {roof.description}
          </p>
        </div>
      </div>

      {/* Field tip */}
      <div style={{ borderTop: '1px solid var(--color-fp-line)', display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 20px' }}>
        <span style={{
          fontFamily: 'var(--font-fp-mono)',
          fontSize: 8.5,
          fontWeight: 700,
          letterSpacing: '0.14em',
          color: 'var(--color-fp-ink-3)',
          textTransform: 'uppercase',
          paddingTop: 1,
          flexShrink: 0,
          width: 62,
        }}>
          FIELD TIP
        </span>
        <span style={{
          fontFamily: 'var(--font-fp-mono)',
          fontSize: 11,
          lineHeight: 1.6,
          color: 'var(--color-fp-ink-2)',
        }}>
          {roof.fieldTip}
        </span>
      </div>
    </div>
  );
}

// ── Shared styles ────────────────────────────────────────────────────────────

const h2Style: React.CSSProperties = {
  fontFamily: 'var(--font-fp-display)',
  fontWeight: 900,
  fontSize: 'clamp(28px, 5vw, 42px)',
  textTransform: 'uppercase',
  color: 'var(--color-fp-ink)',
  margin: '0 0 4px',
  lineHeight: 1.05,
};

const ledeStyle: React.CSSProperties = {
  fontFamily: 'var(--font-fp-mono)',
  fontSize: 11,
  color: 'var(--color-fp-ink-3)',
  margin: 0,
};
