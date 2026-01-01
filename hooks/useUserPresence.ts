'use client'

import { useState, useEffect, useCallback } from 'react'
import useTabActivity from './useTabActivity'

export type UserStatus = 'online' | 'away' | 'offline'

const IDLE_TIMEOUT = 5 * 60 * 1000 // 5 minutes in milliseconds

/**
 * Hook for complete user presence detection
 * Combines tab activity and user idle time to determine status
 *
 * Status logic:
 * - online: Tab active + user interacting (< 5 min idle)
 * - away: Tab active but user idle (> 5 min)
 * - offline: Tab hidden/backgrounded
 */
export default function useUserPresence() {
  const { isTabActive } = useTabActivity()
  const [status, setStatus] = useState<UserStatus>('online')
  const [lastActivity, setLastActivity] = useState(Date.now())

  // Update last activity time
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now())
  }, [])

  // Check idle status
  useEffect(() => {
    const checkIdleStatus = () => {
      const idleTime = Date.now() - lastActivity

      if (!isTabActive) {
        setStatus('offline')
      } else if (idleTime >= IDLE_TIMEOUT) {
        setStatus('away')
      } else {
        setStatus('online')
      }
    }

    // Check immediately
    checkIdleStatus()

    // Check every 30 seconds
    const interval = setInterval(checkIdleStatus, 30000)

    return () => clearInterval(interval)
  }, [isTabActive, lastActivity])

  // Listen for user activity events
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']

    // Throttle activity updates (max once per 5 seconds)
    let throttleTimer: NodeJS.Timeout | null = null
    const throttledUpdateActivity = () => {
      if (!throttleTimer) {
        updateActivity()
        throttleTimer = setTimeout(() => {
          throttleTimer = null
        }, 5000)
      }
    }

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, throttledUpdateActivity)
    })

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, throttledUpdateActivity)
      })
      if (throttleTimer) {
        clearTimeout(throttleTimer)
      }
    }
  }, [updateActivity])

  return { status }
}
