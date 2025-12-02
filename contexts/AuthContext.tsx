'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, signOut as cognitoSignOut, fetchAuthSession } from 'aws-amplify/auth'
import { createClient } from '@/lib/db/supabase'

// TEMPORARY: Set to true to bypass authentication for UI testing
const DEMO_MODE = true

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
}

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  refreshUser: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const fetchUser = async () => {
    try {
      setLoading(true)
      setError(null)

      // DEMO MODE: Skip authentication and use mock user
      if (DEMO_MODE) {
        await new Promise(resolve => setTimeout(resolve, 500)) // Simulate loading
        setUser(MOCK_USERS[DEMO_ROLE])
        setLoading(false)
        console.log('🎭 DEMO MODE: Logged in as', DEMO_ROLE, '-', MOCK_USERS[DEMO_ROLE].name)
        return
      }

      // Get current Cognito user
      const cognitoUser = await getCurrentUser()

      // Get the session to access tokens
      const session = await fetchAuthSession()
      const idToken = session.tokens?.idToken?.toString()

      if (!idToken) {
        throw new Error('No authentication token found')
      }

      // Store token in cookie for middleware
      document.cookie = `idToken=${idToken}; path=/; max-age=3600; samesite=strict`

      // Fetch user data from PostgreSQL
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('cognito_user_id', cognitoUser.userId)
        .single()

      if (userError) {
        console.error('Error fetching user from database:', userError)
        throw new Error('Failed to load user data')
      }

      if (!userData) {
        throw new Error('User not found in database')
      }

      setUser({
        id: userData.id,
        cognitoUserId: userData.cognito_user_id,
        email: userData.email,
        name: userData.name || userData.email,
        role: userData.role,
        phone: userData.phone,
        isActive: userData.is_active,
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
      // DEMO MODE: Just clear user and redirect
      if (DEMO_MODE) {
        setUser(null)
        router.push('/')
        console.log('🎭 DEMO MODE: Signed out')
        return
      }

      await cognitoSignOut()

      // Clear cookie
      document.cookie = 'idToken=; path=/; max-age=0'

      setUser(null)
      router.push('/login')
    } catch (err: any) {
      console.error('Error signing out:', err)
      setError(err.message || 'Failed to sign out')
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  const value = {
    user,
    loading,
    error,
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
