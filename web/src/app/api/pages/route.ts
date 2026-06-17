import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServiceClient()
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    const includeHidden = searchParams.get('includeHidden') === 'true'

    // Fetch user's subscription tier if authenticated
    const authHeader = request.headers.get('authorization')
    let userSubscriptionTier = 'free'

    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '')
        const { data: { user } } = await supabase.auth.getUser(token)

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
      } catch (error) {
        // Continue with free tier if auth fails
        console.warn('Auth verification failed, using free tier')
      }
    }

    // Build query
    let query = supabase
      .from('notion_pages')
      .select('*')
      .order('created_at', { ascending: false })

    // Filter by slug if provided
    if (slug) {
      query = query.eq('slug', slug)
    } else {
      // If no slug, return all pages the user can access
      if (!includeHidden && userSubscriptionTier === 'free') {
        // Free users only see non-hidden pages
        query = query.eq('is_hidden', false)
      } else if (!includeHidden && userSubscriptionTier !== 'free') {
        // Basic/Premium users can see everything
        // No additional filter needed
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch pages' },
        { status: 500 }
      )
    }

    // Transform data for client
    const pages = data?.map(page => ({
      id: page.id,
      notion_page_id: page.notion_page_id,
      parent_page_id: page.parent_page_id,
      title: page.title,
      slug: page.slug,
      content: page.content,
      url: page.url,
      icon: page.icon,
      cover: page.cover,
      is_hidden: page.is_hidden,
      subscription_required: page.subscription_required,
      can_access: !page.is_hidden ||
                  (page.is_hidden &&
                   (userSubscriptionTier === 'premium' || userSubscriptionTier === 'basic')),
      last_synced_at: page.last_synced_at,
      created_at: page.created_at,
      updated_at: page.updated_at,
    })) || []

    return NextResponse.json({ pages })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
