import type { NextConfig } from "next";

// Pin Turbopack's workspace root to THIS directory. There is an unrelated
// package-lock.json higher up the home folder; without this, Next guesses a
// wrong root and prints a warning (and can occasionally mis-resolve modules).
const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
