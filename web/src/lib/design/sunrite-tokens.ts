/**
 * Sunrite OS Design System
 * ========================
 * Based on the sunrite-os.html reference design.
 * 
 * Visual language: Dark-first, cinematic, high-contrast with dramatic imagery.
 * Accent: Orange/amber (sunset tones). Typography: Bold, oversized, minimal UI.
 */

export const tokens = {
  // Color palette
  colors: {
    // Night mode (default)
    night: {
      bg: '#060607',           // Deep black background
      bg2: '#0c0c10',          // Slightly lighter black for layering
      ink: '#FFFFFF',          // Primary text (white)
      ink2: 'rgba(255,255,255,0.72)',   // Secondary text (72% opacity)
      ink3: 'rgba(255,255,255,0.45)',   // Tertiary text (45% opacity)
      line: 'rgba(255,255,255,0.16)',   // Dividers/borders (16% opacity)
      accent: '#E8472A',       // Primary orange-red
      accent2: '#FF8A5B',      // Secondary orange (lighter)
    },
    
    // Day mode (optional, for future use)
    day: {
      bg: '#A9CCEA',           // Sky blue
      bg2: '#E4F0FA',          // Light blue
      ink: '#0B1B2B',          // Dark blue-black text
      ink2: 'rgba(11,27,43,0.72)',
      ink3: 'rgba(11,27,43,0.50)',
      line: 'rgba(11,27,43,0.18)',
      accent: '#E8472A',       // Same accent works in both modes
      accent2: '#FF8A5B',
    },
  },

  // Typography (load these fonts via Google Fonts)
  fonts: {
    display: '"Archivo Black", "Archivo", -apple-system, "Segoe UI", sans-serif',
    mono: '"JetBrains Mono", Menlo, Consolas, monospace',
    sans: '"Archivo", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  // Spacing scale (4px base)
  spacing: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '24px',
    6: '32px',
    7: '48px',
    8: '64px',
  },

  // Border radius
  radius: {
    sm: '6px',
    md: '10px',
    lg: '14px',
    full: '999px',
  },

  // Grain texture overlay (for atmospheric effect)
  grain: {
    opacity: 0.07,
    blendMode: 'overlay' as const,
    // SVG data URI for noise texture
    dataUri: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")`,
  },
} as const;

/**
 * Tailwind CSS v4-compatible theme extension
 * Add this to your tailwind.config.ts
 */
export const tailwindTheme = {
  colors: {
    'sr-bg': 'var(--sr-bg)',
    'sr-bg-2': 'var(--sr-bg-2)',
    'sr-ink': 'var(--sr-ink)',
    'sr-ink-2': 'var(--sr-ink-2)',
    'sr-ink-3': 'var(--sr-ink-3)',
    'sr-line': 'var(--sr-line)',
    'sr-accent': 'var(--sr-accent)',
    'sr-accent-2': 'var(--sr-accent-2)',
  },
  fontFamily: {
    'sr-display': tokens.fonts.display,
    'sr-mono': tokens.fonts.mono,
    'sr-sans': tokens.fonts.sans,
  },
  spacing: tokens.spacing,
  borderRadius: tokens.radius,
};

/**
 * CSS custom properties (inject into <html> or <body>)
 */
export const cssVariables = `
  --sr-bg: ${tokens.colors.night.bg};
  --sr-bg-2: ${tokens.colors.night.bg2};
  --sr-ink: ${tokens.colors.night.ink};
  --sr-ink-2: ${tokens.colors.night.ink2};
  --sr-ink-3: ${tokens.colors.night.ink3};
  --sr-line: ${tokens.colors.night.line};
  --sr-accent: ${tokens.colors.night.accent};
  --sr-accent-2: ${tokens.colors.night.accent2};
  --sr-grain-opacity: ${tokens.grain.opacity};
`;
