import Link from "next/link";
import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl" />
        </div>

        {/* Navigation */}
        <nav className="relative z-10 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-2">
                <div className="text-2xl font-bold text-white">Flight Path</div>
              </div>
              <div className="flex items-center space-x-4">
                <form action={handleLogin}>
                  <button
                    type="submit"
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition"
                  >
                    Sign In
                  </button>
                </form>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-white mb-6">Flight Path</h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Your premium content platform powered by Notion
            </p>

            {/* Access-denied notice (gate rejection / OAuth error). */}
            {error ? (
              <div className="max-w-md mx-auto mb-8 rounded-lg border border-orange-500/40 bg-orange-500/10 p-6 text-left">
                <h2 className="text-lg font-semibold text-orange-300 mb-1">
                  Access denied
                </h2>
                <p className="text-sm text-gray-300">
                  Sign-in is invite-only. Your email must be on the invite list
                  and use an approved company domain. Ask an admin to invite you.
                </p>
              </div>
            ) : null}

            <div className="flex justify-center space-x-4">
              <form action={handleLogin}>
                <button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg text-lg transition inline-flex items-center gap-2"
                >
                  {/* Google "G" mark */}
                  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 5.1 29.3 3 24 3 12.9 3 4 11.9 4 23s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 5.1 29.3 3 24 3 16 3 9.1 7.6 6.3 14.7z" />
                    <path fill="#4CAF50" d="M24 43c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 34.5 26.7 35 24 35c-5.3 0-9.7-2.6-11.3-7l-6.5 5C9 40.3 15.9 43 24 43z" />
                    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2C39.9 36.3 44 31 44 23c0-1.3-.1-2.3-.4-3.5z" />
                  </svg>
                  Sign in with Google
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-900/50 border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                Beautiful Design
              </h3>
              <p className="text-gray-400">
                Super.so-style interface that showcases your content beautifully
              </p>
            </div>
            <div className="bg-slate-900/50 border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                Powered by Notion
              </h3>
              <p className="text-gray-400">
                Edit in Notion, publish instantly. No coding required.
              </p>
            </div>
            <div className="bg-slate-900/50 border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                Mobile Native
              </h3>
              <p className="text-gray-400">
                Native iOS app for the best mobile experience
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
