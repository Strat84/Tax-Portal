'use client'

import { ReactNode } from 'react'
import { useGlobalLoading } from '@/contexts/GlobalLoadingContext'
import { LoadingScreen } from '@/components/LoadingScreen'

export function GlobalLoadingScreenWrapper({ children }: { children: ReactNode }) {
  const { isLoading } = useGlobalLoading()

  return (
    <>
      {isLoading && <LoadingScreen />}
      {children}
    </>
  )
}
