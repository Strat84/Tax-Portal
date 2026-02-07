'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { SUBSCRIBE_USER_STATUS } from '@/graphql/queries/user'
import { UserStatus, UpdateUserResponse } from '@/graphql/types/users'
import { gqlClient } from '@/lib/appsync/client'
import { GraphQLResult } from '@aws-amplify/api-graphql'
import { UPDATE_USER_PROFILE } from '@/graphql/mutation/user'

/**
 * Hook for GraphQL integration of user status
 * Syncs user status with backend and subscribes to real-time updates
 */
export default function useUserStatus(userId?: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)
  const [subscriptionData, setSubscriptionData] = useState<any>(null)
  const subscriptionRef = useRef<any>(null)

  // Function to update status - memoized with useCallback
  const updateUserStatus = useCallback(async (status: UserStatus, additionalFields?: { isActive?: boolean }) => {
    if (!userId) {
      console.warn('Cannot update status: userId is undefined')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await gqlClient.graphql({
        query: UPDATE_USER_PROFILE,
        variables: {
          input: {
            status,
            lastActiveAt: new Date().toISOString(),
            ...(additionalFields?.isActive !== undefined && { isActive: additionalFields.isActive })
          }
        }
      }) as GraphQLResult<UpdateUserResponse>

      setLoading(false)
      return result.data?.updateUser
    } catch (err) {
      console.error('Error updating status:', err)
      setError(err)
      setLoading(false)
      throw err
    }
  }, [userId])

  // Subscribe to status changes
  useEffect(() => {
    if (!userId) return

    // Clean up previous subscription if exists
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
    }

    // Create new subscription
    subscriptionRef.current = (gqlClient
      .graphql({
        query: SUBSCRIBE_USER_STATUS,
        variables: { id: userId }
      }) as any)
      .subscribe({
        next: ({ data }: any) => {
          setSubscriptionData(data?.onUpdateUser)
        },
        error: (err: any) => {
          console.error('Subscription error:', err)
          setError(err)
        }
      })

    // Cleanup on unmount or userId change
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [userId])

  return {
    updateUserStatus,
    loading,
    error,
    subscriptionData
  }
}