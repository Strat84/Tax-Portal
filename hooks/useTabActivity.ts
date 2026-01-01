'use client'

import { useState, useEffect } from 'react'

/**
 * Hook to detect if browser tab is active or in background
 * Uses Page Visibility API to track tab state
 */
export default function useTabActivity() {
  const [isTabActive, setIsTabActive] = useState(true)

  useEffect(() => {
    // Check if document is visible on mount
    setIsTabActive(!document.hidden)

    // Handler for visibility change
    const handleVisibilityChange = () => {
      setIsTabActive(!document.hidden)
    }

    // Add event listener
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup listener on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return { isTabActive }
}
