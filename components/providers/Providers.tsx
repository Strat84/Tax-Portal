'use client'

import { ReactNode } from 'react'
import { ApolloProvider } from '@apollo/client'
import { AuthProvider } from '@/contexts/AuthContext'
import { GlobalLoadingProvider } from '@/contexts/GlobalLoadingContext'
import { configureAmplify } from '@/lib/auth/cognito'
import { client } from '@/lib/apollo/client'
import { GlobalLoadingScreenWrapper } from '@/components/GlobalLoadingScreenWrapper'

// Configure Amplify once
configureAmplify()

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ApolloProvider client={client}>
      <AuthProvider>
        <GlobalLoadingProvider>
          <GlobalLoadingScreenWrapper>
            {children}
          </GlobalLoadingScreenWrapper>
        </GlobalLoadingProvider>
      </AuthProvider>
    </ApolloProvider>
  )
}
