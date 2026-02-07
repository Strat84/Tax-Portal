'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, signOut as cognitoSignOut, fetchAuthSession } from 'aws-amplify/auth'
import { extractUserFromToken } from '@/lib/auth/cognito'
import { gqlClient } from '@/lib/appsync/client'
import { GET_CURRENT_USER } from '@/graphql/queries/user'
import useUserPresence, { UserStatus } from '@/hooks/useUserPresence'
import useUserStatus from '@/hooks/useUserStatus'
import { GetUserResponse, TaxReturnStatus } from '@/graphql/types/users'
import { GraphQLResult } from '@aws-amplify/api-graphql'

// TEMPORARY: Set to true to bypass authentication for UI testing
// Set to false in real environments so AuthProvider performs real authentication
const DEMO_MODE = false

// Mock users for demo mode - change the role to test different views
const MOCK_USERS = {
  CLIENT: {
    id: 'client-demo-001',
    cognitoUserId: 'demo-cognito-client',
    email: 'client@demo.com',
    name: 'John Doe',
    role: 'CLIENT' as const,
    phone: '555-0100',
    isActive: true,
  },
  TAX_PRO: {
    id: 'taxpro-demo-001',
    cognitoUserId: 'demo-cognito-taxpro',
    email: 'taxpro@demo.com',
    name: 'Sarah Johnson',
    role: 'TAX_PRO' as const,
    phone: '555-0200',
    isActive: true,
  },
  ADMIN: {
    id: 'admin-demo-001',
    cognitoUserId: 'demo-cognito-admin',
    email: 'admin@demo.com',
    name: 'Admin User',
    role: 'ADMIN' as const,
    phone: '555-0300',
    isActive: true,
  },
}

// Change this to 'CLIENT', 'TAX_PRO', or 'ADMIN' to test different roles
const DEMO_ROLE: 'CLIENT' | 'TAX_PRO' | 'ADMIN' = 'TAX_PRO'

interface User {
  id: string
  cognitoUserId: string
  email: string
  name: string
  role: 'ADMIN' | 'TAX_PRO' | 'CLIENT'
  phone?: string
  isActive: boolean
  status?: UserStatus
  taxReturnStatus?: string
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
        return
      }

      // Get the session to access tokens - Amplify handles cookies automatically
      setLoading(true)

      const session = await fetchAuthSession()
      const idTokenObj = session.tokens?.idToken
      const idToken = idTokenObj?.toString()

      if (!idToken) {
        setUser(null)
        setLoading(false)
        return
      }

      // Extract basic user info from idToken
      const extracted = extractUserFromToken(idTokenObj)
      if (!extracted) {
        throw new Error('Failed to extract user from token')
      }


      // Fetch complete user profile from GraphQL
      try {
        const result = await gqlClient.graphql({
          query: GET_CURRENT_USER
        }) as GraphQLResult<GetUserResponse>

        const userData = result.data?.getUser
        if (userData) {
          setUser({
            id: userData.id,
            cognitoUserId: extracted.cognitoUserId,
            email: userData.email,
            name: userData.name || extracted.name || userData.email,
            role: userData.role as 'ADMIN' | 'TAX_PRO' | 'CLIENT',
            phone: userData.phone,
            isActive: userData.isActive,
            status: userData.status as UserStatus,
            taxReturnStatus: userData.taxReturnStatus as TaxReturnStatus,
          })
        } else {
          // Fallback to token data if GraphQL fails
          setUser({
            id: extracted.cognitoUserId,
            cognitoUserId: extracted.cognitoUserId,
            email: extracted.email,
            name: extracted.name || extracted.email,
            role: extracted.role as 'ADMIN' | 'TAX_PRO' | 'CLIENT',
            phone: undefined,
            isActive: true
          })
        }
      } catch (gqlError) {
        console.error('Error fetching user from GraphQL:', gqlError)
        // Fallback to token data if GraphQL fails
        setUser({
          id: extracted.cognitoUserId,
          cognitoUserId: extracted.cognitoUserId,
          email: extracted.email,
          name: extracted.name || extracted.email,
          role: extracted.role as 'ADMIN' | 'TAX_PRO' | 'CLIENT',
          phone: undefined,
          isActive: true,
        })
      }

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
        setLoading(false)
        router.push('/')
        return
      }

      // Update user status to offline and set isActive to false before signing out
      if (user?.id) {
        try {
          await updateUserStatus('offline', { isActive: false })
        } catch (err) {
          // Continue with logout even if status update fails
        }
      }

      // Sign out - Amplify clears its cookies automatically
      await cognitoSignOut()

      setUser(null)
      setError(null)
      setLoading(false)
      router.push('/login')
    } catch (err: any) {
      console.error('Error signing out:', err)
      // Still clear user and redirect even on error
      setUser(null)
      setLoading(false)
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
  }, [currentStatus, user?.id, updateUserStatus])

  // Function to manually set status - just sets local state, useEffect handles backend sync
  const setManualStatus = async (status: UserStatus) => {
    setManualStatusState(status)
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
