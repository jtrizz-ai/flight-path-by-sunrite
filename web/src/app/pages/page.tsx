import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

async function getPages() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch user's subscription tier
  let userSubscriptionTier = 'free'
  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()

    if (userData) {
      userSubscriptionTier = userData.subscription_tier
    }
  }

  // Fetch pages
  const { data: pages } = await supabase
    .from('notion_pages')
    .select('*')
    .order('title', { ascending: true })

  // Filter based on subscription
  const accessiblePages = pages?.filter(page => {
    if (!page.is_hidden) return true
    return userSubscriptionTier === 'premium' || userSubscriptionTier === 'basic'
  }) || []

  return { pages: accessiblePages, user, userSubscriptionTier }
}

async function PageList() {
  const { pages, user, userSubscriptionTier } = await getPages()

  if (!user) {
    redirect('/')
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Content Library</h1>
        <p className="text-gray-400">
          Browse all available content. Your subscription: <span className="text-orange-400 capitalize">{userSubscriptionTier}</span>
        </p>
      </div>

      {/* Pages Grid */}
      {pages.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            No content available yet. Check back soon!
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pages.map((page) => (
            <Link
              key={page.id}
              href={`/pages/${page.slug}`}
              className="group bg-slate-900/50 border border-white/10 rounded-lg p-6 hover:border-orange-500/50 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  {page.icon && (
                    <span className="text-2xl mr-2">{page.icon}</span>
                  )}
                  <h3 className="text-xl font-semibold text-white group-hover:text-orange-400 transition">
                    {page.title}
                  </h3>
                </div>
                {page.is_hidden && (
                  <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded">
                    Premium
                  </span>
                )}
              </div>

              {page.cover && (
                <div className="mb-3 rounded overflow-hidden">
                  <img
                    src={page.cover}
                    alt={page.title}
                    className="w-full h-32 object-cover"
                  />
                </div>
              )}

              <div className="text-gray-400 text-sm">
                Last updated: {new Date(page.updated_at).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PagesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
      <nav className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              href="/"
              className="text-2xl font-bold text-white hover:text-orange-400 transition"
            >
              Flight Path
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="text-gray-300 hover:text-white transition"
              >
                Admin
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Suspense fallback={<div className="text-white">Loading...</div>}>
            <PageList />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
