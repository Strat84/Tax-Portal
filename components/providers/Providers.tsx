'use client'

import { ReactNode } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import { GlobalLoadingProvider } from '@/contexts/GlobalLoadingContext'
import { configureAmplify } from '@/lib/auth/cognito'
import { GlobalLoadingScreenWrapper } from '@/components/GlobalLoadingScreenWrapper'

// Configure Amplify once
configureAmplify()

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <GlobalLoadingProvider>
        <GlobalLoadingScreenWrapper>
          {children}
        </GlobalLoadingScreenWrapper>
      </GlobalLoadingProvider>
    </AuthProvider>
  )
}
