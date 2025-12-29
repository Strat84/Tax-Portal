'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function PublicGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard')
    }
  }, [loading, user, router])

  // Don't render anything while auth is loading
  // Also don't render if user exists (redirect will happen via useEffect)
  if (loading || user) {
    return null
  }

  // Only render children after auth check is complete AND no user is logged in
  return <>{children}</>
}
