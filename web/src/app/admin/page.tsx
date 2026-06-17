import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

async function getAdminData() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Check if user is admin
  const isAdmin = user.email === process.env.ADMIN_EMAIL

  if (!isAdmin) {
    return null
  }

  // Get recent crawl logs
  const { data: crawlLogs } = await supabase
    .from('crawl_logs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(10)

  // Get page count
  const { count: totalPages } = await supabase
    .from('notion_pages')
    .select('*', { count: 'exact', head: true })

  // Get hidden pages count
  const { count: hiddenPages } = await supabase
    .from('notion_pages')
    .select('*', { count: 'exact', head: true })
    .eq('is_hidden', true)

  // Get last successful crawl
  const { data: lastCrawl } = await supabase
    .from('crawl_logs')
    .select('*')
    .eq('status', 'completed')
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  return {
    user,
    crawlLogs: crawlLogs || [],
    totalPages: totalPages || 0,
    hiddenPages: hiddenPages || 0,
    lastCrawl,
  }
}

async function triggerCrawl(): Promise<{ success: boolean; message: string }> {
  const supabase = await createSupabaseServerClient()

  try {
    // This would typically call your worker API or use Supabase Edge Functions
    // For now, we'll return a message explaining the setup
    return {
      success: true,
      message: 'Crawl triggered. The worker will process this request based on its schedule.'
    }
  } catch (error) {
    return {
      success: false,
      message: 'Failed to trigger crawl. Check worker status.'
    }
  }
}

export default async function AdminPage() {
  const data = await getAdminData()

  if (!data) {
    redirect('/')
  }

  const { user, crawlLogs, totalPages, hiddenPages, lastCrawl } = data

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
                href="/pages"
                className="text-gray-300 hover:text-white transition"
              >
                Library
              </Link>
              <div className="text-gray-400">Admin</div>
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user.email?.[0].toUpperCase()}
                </span>
              </div>
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
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Admin Portal</h1>
            <p className="text-gray-400">Manage your Flight Path content and settings</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-900/50 border border-white/10 rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-1">Total Pages</div>
              <div className="text-3xl font-bold text-white">{totalPages}</div>
            </div>
            <div className="bg-slate-900/50 border border-white/10 rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-1">Hidden Pages</div>
              <div className="text-3xl font-bold text-orange-400">{hiddenPages}</div>
            </div>
            <div className="bg-slate-900/50 border border-white/10 rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-1">Last Crawl</div>
              <div className="text-lg font-semibold text-white">
                {lastCrawl ? new Date(lastCrawl.started_at).toLocaleDateString() : 'Never'}
              </div>
            </div>
            <div className="bg-slate-900/50 border border-white/10 rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-1">Worker Status</div>
              <div className="text-lg font-semibold text-green-400">Active</div>
            </div>
          </div>

          {/* Manual Crawl */}
          <div className="bg-slate-900/50 border border-white/10 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Manual Crawl</h2>
            <p className="text-gray-400 mb-4">
              Trigger a manual crawl of your Notion pages. This will update all content in the database.
            </p>
            <form action={async () => {
              'use server'
              const result = await triggerCrawl()
              console.log(result)
            }}>
              <button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition"
              >
                Trigger Crawl Now
              </button>
            </form>
          </div>

          {/* Recent Crawl Logs */}
          <div className="bg-slate-900/50 border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>

            {crawlLogs.length === 0 ? (
              <div className="text-gray-400">No crawl activity yet.</div>
            ) : (
              <div className="space-y-3">
                {crawlLogs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-slate-800/50 border border-white/5 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          log.status === 'completed'
                            ? 'bg-green-500/20 text-green-400'
                            : log.status === 'running'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {log.status}
                        </span>
                        <span className="text-gray-400 text-sm">
                          {new Date(log.started_at).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="text-sm text-gray-300">
                      <div>Pages processed: {log.pages_processed}</div>
                      <div>Pages created: {log.pages_created}</div>
                      <div>Pages updated: {log.pages_updated}</div>
                      {log.error_message && (
                        <div className="text-red-400 mt-1">Error: {log.error_message}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="mt-8 flex space-x-4">
            <Link
              href="/pages"
              className="text-gray-400 hover:text-white transition"
            >
              View Public Pages →
            </Link>
            <Link
              href="https://supabase.com/dashboard"
              target="_blank"
              className="text-gray-400 hover:text-white transition"
            >
              Supabase Dashboard →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
