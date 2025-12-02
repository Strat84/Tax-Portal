'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, signOut as cognitoSignOut, fetchAuthSession } from 'aws-amplify/auth'
import { createClient } from '@/lib/db/supabase'

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
