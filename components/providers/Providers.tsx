'use client'

import { ReactNode } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import { configureAmplify } from '@/lib/auth/cognito'

// Configure Amplify once
configureAmplify()

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}
