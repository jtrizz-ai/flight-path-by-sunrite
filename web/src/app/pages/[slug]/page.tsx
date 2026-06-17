import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

interface PageParams {
  params: { slug: string }
}

async function getPage(slug: string) {
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

  // Fetch page by slug
  const { data: page } = await supabase
    .from('notion_pages')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!page) {
    return null
  }

  // Check access permissions
  const canAccess = !page.is_hidden ||
                   (userSubscriptionTier === 'premium' ||
                    userSubscriptionTier === 'basic')

  return { page, canAccess, user }
}

function ContentBlock({ block }: { block: any }) {
  switch (block.type) {
    case 'paragraph':
      return (
        <p className="text-gray-300 mb-4">
          {block.content.text || block.content.plain_text}
        </p>
      )

    case 'heading_1':
      return (
        <h1 className="text-3xl font-bold text-white mb-4">
          {block.content.text || block.content.plain_text}
        </h1>
      )

    case 'heading_2':
      return (
        <h2 className="text-2xl font-semibold text-white mb-3">
          {block.content.text || block.content.plain_text}
        </h2>
      )

    case 'heading_3':
      return (
        <h3 className="text-xl font-semibold text-white mb-2">
          {block.content.text || block.content.plain_text}
        </h3>
      )

    case 'bulleted_list':
      return (
        <li className="text-gray-300 ml-4 mb-2">
          • {block.content.text || block.content.plain_text}
        </li>
      )

    case 'numbered_list':
      return (
        <li className="text-gray-300 ml-4 mb-2">
          {block.content.number}. {block.content.text || block.content.plain_text}
        </li>
      )

    case 'to_do':
      return (
        <div className="flex items-center mb-2">
          <input
            type="checkbox"
            checked={block.content.checked}
            readOnly
            className="mr-2"
          />
          <span className="text-gray-300">
            {block.content.text || block.content.plain_text}
          </span>
        </div>
      )

    case 'callout':
      return (
        <div className="bg-slate-800/50 border border-white/10 rounded-lg p-4 mb-4">
          {block.content.icon && <span className="mr-2">{block.content.icon}</span>}
          <span className="text-gray-300">{block.content.text || block.content.plain_text}</span>
        </div>
      )

    case 'quote':
      return (
        <blockquote className="border-l-4 border-orange-500 pl-4 mb-4 italic text-gray-300">
          {block.content.text || block.content.plain_text}
        </blockquote>
      )

    case 'divider':
      return <hr className="border-white/10 my-6" />

    case 'code':
      return (
        <pre className="bg-slate-800 rounded-lg p-4 mb-4 overflow-x-auto">
          <code className="text-gray-300">{block.content.text || block.content.plain_text}</code>
        </pre>
      )

    default:
      return null
  }
}

async function PageContent({ slug }: { slug: string }) {
  const data = await getPage(slug)

  if (!data?.page) {
    notFound()
  }

  const { page, canAccess, user } = data

  if (!canAccess) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-white mb-2">Premium Content</h2>
        <p className="text-gray-400 mb-6">
          This content is available for premium subscribers only.
        </p>
        <div className="bg-orange-500/20 border border-orange-500/50 rounded-lg p-6 mb-6">
          <h3 className="text-orange-400 font-semibold mb-2">Upgrade to Access</h3>
          <p className="text-gray-300 text-sm">
            Get access to exclusive content and premium features.
          </p>
        </div>
        <Link
          href="/pages"
          className="text-orange-400 hover:text-orange-300 transition"
        >
          ← Back to Library
        </Link>
      </div>
    )
  }

  const contentBlocks = page.content?.blocks || []

  return (
    <div className="max-w-4xl mx-auto">
      {/* Cover Image */}
      {page.cover && (
        <div className="mb-8 rounded-lg overflow-hidden">
          <img
            src={page.cover}
            alt={page.title}
            className="w-full h-64 object-cover"
          />
        </div>
      )}

      {/* Page Header */}
      <div className="mb-8">
        {page.icon && (
          <div className="text-6xl mb-4">{page.icon}</div>
        )}
        <h1 className="text-5xl font-bold text-white mb-4">{page.title}</h1>

        {/* Metadata */}
        <div className="flex items-center space-x-4 text-sm text-gray-400 mb-6">
          <span>Updated {new Date(page.updated_at).toLocaleDateString()}</span>
          {page.is_hidden && (
            <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded">
              Premium
            </span>
          )}
        </div>

        {/* Back Button */}
        <Link
          href="/pages"
          className="text-orange-400 hover:text-orange-300 transition"
        >
          ← Back to Library
        </Link>
      </div>

      {/* Content Blocks */}
      <div className="prose prose-invert max-w-none">
        {contentBlocks.length === 0 ? (
          <div className="text-gray-400">No content available.</div>
        ) : (
          contentBlocks.map((block: any, index: number) => (
            <ContentBlock key={index} block={block} />
          ))
        )}
      </div>
    </div>
  )
}

export default function PageDetailPage({ params }: PageParams) {
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
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Suspense fallback={<div className="text-white">Loading...</div>}>
            <PageContent slug={params.slug} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
