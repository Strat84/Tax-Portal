'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, signOut as cognitoSignOut, fetchAuthSession } from 'aws-amplify/auth'
import { extractUserFromToken } from '@/lib/auth/cognito'
import { client as apolloClient } from '@/lib/apollo/client'
import useUserPresence, { UserStatus } from '@/hooks/useUserPresence'
import useUserStatus from '@/hooks/useUserStatus'

// TEMPORARY: Set to true to bypass authentication for UI testing
// Set to false in real environments so AuthProvider performs real authentication
const DEMO_MODE = false

// Mock users for demo mode - change the role to test different views
const MOCK_USERS = {
  client: {
    id: 'client-demo-001',
    cognitoUserId: 'demo-cognito-client',
    email: 'client@demo.com',
    name: 'John Doe',
    role: 'client' as const,
    phone: '555-0100',
    isActive: true,
  },
  tax_pro: {
    id: 'taxpro-demo-001',
    cognitoUserId: 'demo-cognito-taxpro',
    email: 'taxpro@demo.com',
    name: 'Sarah Johnson',
    role: 'tax_pro' as const,
    phone: '555-0200',
    isActive: true,
  },
  admin: {
    id: 'admin-demo-001',
    cognitoUserId: 'demo-cognito-admin',
    email: 'admin@demo.com',
    name: 'Admin User',
    role: 'admin' as const,
    phone: '555-0300',
    isActive: true,
  },
}

// Change this to 'client', 'tax_pro', or 'admin' to test different roles
const DEMO_ROLE: 'client' | 'tax_pro' | 'admin' = 'tax_pro'

interface User {
  id: string
  cognitoUserId: string
  email: string
  name: string
  role: 'admin' | 'tax_pro' | 'client'
  phone?: string
  isActive: boolean
  status?: UserStatus
}

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  userStatus: UserStatus
  setManualStatus: (status: UserStatus) => Promise<void>
  refreshUser: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [manualStatus, setManualStatusState] = useState<UserStatus | null>(null)
  const router = useRouter()

  // Auto-detect presence status
  const { status: autoStatus } = useUserPresence()

  // GraphQL status sync
  const { updateUserStatus } = useUserStatus(user?.id)

  // Use manual status if set, otherwise use auto-detected status
  const currentStatus = manualStatus || autoStatus

  const fetchUser = async () => {
    try {
      setError(null)

      // DEMO MODE: Skip authentication and use mock user
      if (DEMO_MODE) {
        setLoading(true)
        await new Promise(resolve => setTimeout(resolve, 500)) // Simulate loading
        setUser(MOCK_USERS[DEMO_ROLE])
        setLoading(false)
        console.log('🎭 DEMO MODE: Logged in as', DEMO_ROLE, '-', MOCK_USERS[DEMO_ROLE].name)
        return
      }

      // If there's no auth token cookie, don't attempt to call Cognito/Supabase.
      // This avoids hitting Supabase on public pages (login/signup/etc.).
      const hasIdToken = typeof document !== 'undefined' && /(^|; )idToken=([^;]+)/.test(document.cookie)
      if (!hasIdToken) {
        setUser(null)
        setLoading(false)
        return
      }

      // Token exists, now check auth - set loading only when actually checking auth
      setLoading(true)

      // Get the session to access tokens
      const session = await fetchAuthSession()
      const idTokenObj = session.tokens?.idToken
      const idToken = idTokenObj?.toString()

      if (!idToken) {
        throw new Error('No authentication token found')
      }

      // Store token in cookie for middleware
      document.cookie = `idToken=${idToken}; path=/; max-age=3600; samesite=strict`

      // Extract user info from idToken instead of querying Supabase
      const extracted = extractUserFromToken(idTokenObj)
      if (!extracted) {
        throw new Error('Failed to extract user from token')
      }

      console.log("Extracted user from token:", extracted)
      setUser({
        id: extracted.cognitoUserId,
        cognitoUserId: extracted.cognitoUserId,
        email: extracted.email,
        name: extracted.name || extracted.email,
        role: extracted.role as 'admin' | 'tax_pro' | 'client',
        phone: undefined,
        isActive: true,
      })

      setLoading(false)
    } catch (err: any) {
      console.error('Error in fetchUser:', err)
      setError(err.message || 'Failed to load user')
      setUser(null)
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      setLoading(true)
      setError(null)

      // DEMO MODE: Just clear user and redirect
      if (DEMO_MODE) {
        setUser(null)
        await apolloClient.cache.reset()
        setLoading(false)
        router.push('/')
        console.log('🎭 DEMO MODE: Signed out')
        return
      }

      // Update user status to offline and set isActive to false before signing out
      if (user?.id) {
        try {
          await updateUserStatus('offline', { isActive: false })
          console.log('User status updated to offline and isActive set to false before logout')
        } catch (err) {
          console.error('Failed to update user status before logout:', err)
          // Continue with logout even if status update fails
        }
      }

      // Sign out locally (not globally to avoid invalidating the session during status update)
      await cognitoSignOut()

      // Clear all auth cookies
      document.cookie = 'idToken=; path=/; max-age=0'
      document.cookie = 'amplifyAuthenticatedUser=; path=/; max-age=0'

      // Clear Apollo Client cache to remove old token and cached queries
      await apolloClient.cache.reset()

      setUser(null)
      setError(null)
      setLoading(false)
      router.push('/login')
    } catch (err: any) {
      console.error('Error signing out:', err)
      // Still clear user and redirect even on error
      setUser(null)
      setLoading(false)
      document.cookie = 'idToken=; path=/; max-age=0'
      document.cookie = 'amplifyAuthenticatedUser=; path=/; max-age=0'

      // Clear Apollo cache even on error
      await apolloClient.cache.reset()

      router.push('/login')
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  // Sync status with backend when it changes
  useEffect(() => {
    if (user?.id && currentStatus) {
      updateUserStatus(currentStatus).catch(err => {
        console.error('Failed to sync status with backend:', err)
      })
    }
  }, [currentStatus, user?.id])

  // Function to manually set status
  const setManualStatus = async (status: UserStatus) => {
    setManualStatusState(status)
    if (user?.id) {
      try {
        await updateUserStatus(status)
      } catch (err) {
        console.error('Failed to update manual status:', err)
        throw err
      }
    }
  }

  const value = {
    user,
    loading,
    error,
    userStatus: currentStatus,
    setManualStatus,
    refreshUser: fetchUser,
    signOut: handleSignOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
