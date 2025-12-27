'use client'

import { createContext, useContext, ReactNode } from 'react'
import { User } from '@/graphql/types/users'

interface DashboardUserContextType {
  user?: User
  loading?: boolean
  error?: any
}

const DashboardUserContext = createContext<DashboardUserContextType | undefined>(
  undefined
)

export function DashboardUserProvider({
  children,
  user,
  loading,
  error,
}: DashboardUserContextType & { children: ReactNode }) {
  return (
    <DashboardUserContext.Provider value={{ user, loading, error }}>
      {children}
    </DashboardUserContext.Provider>
  )
}

export function useDashboardUser() {
  const context = useContext(DashboardUserContext)
  if (context === undefined) {
    throw new Error(
      'useDashboardUser must be used within DashboardUserProvider'
    )
  }
  return context
}
