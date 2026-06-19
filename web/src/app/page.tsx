import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";
import { LaunchLights } from "@/components/fp/LaunchLights";

// Server action: kicks off the Google OAuth flow, then sends the user to /flight-path
// on success. If the gate (lib/auth/gate.ts) rejects them, Auth.js bounces them
// back here with ?error and we show a friendly message.
async function handleLogin() {
  "use server";
  await signIn("google", { redirectTo: "/flight-path" });
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  const { error } = await searchParams;

  // Logged-in users skip the landing page and go straight to Flight Path.
  if (session?.user) redirect("/flight-path");

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ backgroundColor: "var(--color-fp-bg)" }}>
      {/* ── Cinematic background (matches iOS LoginView) ── */}
      <img
        src="/images/home_scene.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Radial vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(90% 60% at 50% 38%, rgba(6,6,7,0) 40%, rgba(6,6,7,0.55) 100%)",
        }}
      />
      {/* Linear top→bottom scrim (login values) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(6,6,7,0.5) 0%, rgba(6,6,7,0) 22%, rgba(6,6,7,0) 55%, rgba(6,6,7,0.88) 100%)",
        }}
      />
      {/* Animated runway approach lights */}
      <LaunchLights />
      {/* Film grain */}
      <div className="grain-overlay" />

      {/* ── Content ── */}
      <div className="relative z-10 flex min-h-screen flex-col items-center px-8">
        {/* Hero block */}
        <div className="flex flex-col items-center pt-14 md:pt-20 text-center">
          <div
            className="font-[var(--font-fp-mono)] text-[11px] tracking-[0.42em] uppercase mb-2.5"
            style={{ color: "var(--color-fp-ink-2)" }}
          >
            PRIVATE PROGRAM
          </div>
          <h1
            className="font-[var(--font-fp-display)] text-6xl md:text-7xl lg:text-8xl uppercase leading-[0.9] tracking-[0.02em]"
            style={{
              color: "var(--color-fp-ink)",
              textShadow: "0 6px 44px rgba(0,0,0,0.9)",
            }}
          >
            FLIGHT PATH
          </h1>
        </div>

        {/* Spacer pushes sign-in to the bottom */}
        <div className="flex-1" />

        {/* Sign-in block */}
        <div className="flex w-full max-w-sm flex-col items-center pb-13 md:pb-16">
          {/* Access-denied notice (gate rejection / OAuth error) */}
          {error ? (
            <div
              className="mb-5 w-full rounded-[14px] border p-4 text-center"
              style={{
                borderColor: "rgba(232,71,42,0.4)",
                backgroundColor: "rgba(232,71,42,0.08)",
              }}
            >
              <div
                className="font-[var(--font-fp-mono)] text-[10px] tracking-[0.12em] uppercase mb-1"
                style={{ color: "var(--color-fp-accent)" }}
              >
                Access Denied
              </div>
              <p
                className="font-[var(--font-fp-sans)] text-[12px] leading-relaxed"
                style={{ color: "var(--color-fp-ink-2)" }}
              >
                Your email must use an approved company domain and be on the
                invite list. Ask an admin to add you.
              </p>
            </div>
          ) : null}

          <div
            className="font-[var(--font-fp-mono)] text-[10px] tracking-[0.3em] uppercase mb-4"
            style={{ color: "var(--color-fp-ink-3)" }}
          >
            TEAM ACCESS ONLY
          </div>

          {/* Google sign-in button */}
          <form action={handleLogin} className="w-full">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-[14px] py-4 transition-colors duration-200"
              style={{
                backgroundColor: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.18)",
              }}
            >
              {/* Google "G" mark */}
              <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 5.1 29.3 3 24 3 12.9 3 4 11.9 4 23s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 5.1 29.3 3 24 3 16 3 9.1 7.6 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 43c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 34.5 26.7 35 24 35c-5.3 0-9.7-2.6-11.3-7l-6.5 5C9 40.3 15.9 43 24 43z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2C39.9 36.3 44 31 44 23c0-1.3-.1-2.3-.4-3.5z" />
              </svg>
              <span
                className="font-[var(--font-fp-sans)] text-[15px] font-semibold"
                style={{ color: "var(--color-fp-ink)" }}
              >
                Continue with Google
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
