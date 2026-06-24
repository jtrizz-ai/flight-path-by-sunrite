import type { NextConfig } from "next";

// Pin Turbopack's workspace root to THIS directory. There is an unrelated
// package-lock.json higher up the home folder; without this, Next guesses a
// wrong root and prints a warning (and can occasionally mis-resolve modules).
const nextConfig: NextConfig = {
  // Required for Docker: copies only what's needed into .next/standalone
  output: 'standalone',
  turbopack: {
    root: process.cwd(),
  },
  // Allow the Abacus AI preview domain to access dev resources
  allowedDevOrigins: ['14f6d652c.na121.preview.abacusai.app'],
};

export default nextConfig;
