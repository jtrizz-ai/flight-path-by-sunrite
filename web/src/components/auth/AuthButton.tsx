'use client'

import { createSupabaseClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export function AuthButton() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createSupabaseClient()

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then((result: any) => {
      const userData = result.data.user
      setUser(userData)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleSignIn = () => {
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  if (loading) {
    return (
      <div className="w-8 h-8 bg-gray-600 rounded-full animate-pulse" />
    )
  }

  if (user) {
    return (
      <div className="flex items-center space-x-4">
        <button
          onClick={handleSignOut}
          className="text-gray-300 hover:text-white transition"
        >
          Sign Out
        </button>
        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-medium">
            {user.email?.[0].toUpperCase()}
          </span>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={handleSignIn}
      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition"
    >
      Sign In
    </button>
  )
}
