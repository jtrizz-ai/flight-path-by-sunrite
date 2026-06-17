import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const handleLogin = async () => {
    'use server'
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
      }
    })
    if (!error && data.url) {
      redirect(data.url)
    }
  }

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
                {user ? (
                  <>
                    <Link
                      href="/pages"
                      className="text-gray-300 hover:text-white transition"
                    >
                      Browse Pages
                    </Link>
                    <Link
                      href="/admin"
                      className="text-gray-300 hover:text-white transition"
                    >
                      Admin
                    </Link>
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user.email?.[0].toUpperCase()}
                      </span>
                    </div>
                  </>
                ) : (
                  <form action={handleLogin}>
                    <button
                      type="submit"
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition"
                    >
                      Sign In
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-white mb-6">
              Flight Path
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Your premium content platform powered by Notion
            </p>
            <div className="flex justify-center space-x-4">
              {user ? (
                <Link
                  href="/pages"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg text-lg transition"
                >
                  Browse Content
                </Link>
              ) : (
                <form action={handleLogin}>
                  <button
                    type="submit"
                    className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg text-lg transition"
                  >
                    Get Started
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-900/50 border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-2">Beautiful Design</h3>
              <p className="text-gray-400">Super.so-style interface that showcases your content beautifully</p>
            </div>
            <div className="bg-slate-900/50 border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-2">Powered by Notion</h3>
              <p className="text-gray-400">Edit in Notion, publish instantly. No coding required.</p>
            </div>
            <div className="bg-slate-900/50 border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-2">Mobile Native</h3>
              <p className="text-gray-400">Native iOS app for the best mobile experience</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
