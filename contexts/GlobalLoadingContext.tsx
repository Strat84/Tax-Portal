'use client'

import { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

interface GlobalLoadingContextType {
  isLoading: boolean
}

const GlobalLoadingContext = createContext<GlobalLoadingContextType | undefined>(undefined)

export function GlobalLoadingProvider({ children }: { children: ReactNode }) {
  const { loading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Show loading while auth is initializing
    setIsLoading(authLoading)
  }, [authLoading])

  return (
    <GlobalLoadingContext.Provider value={{ isLoading }}>
      {children}
    </GlobalLoadingContext.Provider>
  )
}

export function useGlobalLoading() {
  const context = useContext(GlobalLoadingContext)
  if (context === undefined) {
    throw new Error('useGlobalLoading must be used within GlobalLoadingProvider')
  }
  return context
}
