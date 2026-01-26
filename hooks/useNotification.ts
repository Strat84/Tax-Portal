'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { gqlClient } from '@/lib/appsync/client'
import { LIST_NOTIFICATION } from '@/graphql/queries/notification'
import { UPDATE_NOTIFICATION } from '@/graphql/mutation/notification'
import { ON_NEW_NOTIFICATION } from '@/graphql/subscription/notification'
import {
  ListNotificationsResponse,
  UpdateNotificationResponse,
  NotificationItem,
  NotificationSeenStatus
} from '@/graphql/types/notification'
import { GraphQLResult } from '@aws-amplify/api-graphql'

// Hook for listing notifications with pagination
export function useListNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)
  const [nextToken, setNextToken] = useState<string | undefined>(undefined)
  const [hasMore, setHasMore] = useState(true)

  const fetchNotifications = useCallback(async (limit: number = 10, token?: string) => {
    setLoading(true)
    setError(null)

    try {
      const result = await gqlClient.graphql({
        query: LIST_NOTIFICATION,
        variables: {
          limit,
          nextToken: token
        }
      }) as GraphQLResult<ListNotificationsResponse>

      const items = result.data?.listNotifications?.items || []
      const newNextToken = result.data?.listNotifications?.nextToken

      // If token was provided, append to existing notifications
      if (token) {
        setNotifications(prev => [...prev, ...items])
      } else {
        // Otherwise, replace notifications (initial fetch)
        setNotifications(items)
      }

      setNextToken(newNextToken)
      setHasMore(!!newNextToken)
      setLoading(false)

      return {
        items,
        nextToken: newNextToken,
        hasMore: !!newNextToken
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
      setError(err)
      setLoading(false)
      throw err
    }
  }, [])

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return
    return fetchNotifications(10, nextToken)
  }, [nextToken, hasMore, loading, fetchNotifications])

  const refresh = useCallback(async () => {
    setNextToken(undefined)
    setHasMore(true)
    return fetchNotifications(10)
  }, [fetchNotifications])

  return {
    notifications,
    loading,
    error,
    nextToken,
    hasMore,
    fetchNotifications,
    loadMore,
    refresh,
    setNotifications
  }
}

// Hook for updating notification
export function useUpdateNotification() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)

  const updateNotification = useCallback(async (
    PK: string,
    SK: string,
    isSeenStatus: NotificationSeenStatus
  ) => {
    setLoading(true)
    setError(null)

    try {
      const result = await gqlClient.graphql({
        query: UPDATE_NOTIFICATION,
        variables: {
          input: {
            PK,
            SK,
            isSeenStatus
          }
        }
      }) as GraphQLResult<UpdateNotificationResponse>

      setLoading(false)
      return result.data?.updateNotification
    } catch (err) {
      console.error('Failed to update notification:', err)
      setError(err)
      setLoading(false)
      throw err
    }
  }, [])

  return {
    updateNotification,
    loading,
    error
  }
}

// Hook for subscribing to new notifications
export function useNotificationSubscription(userId?: string) {
  const [subscriptionData, setSubscriptionData] = useState<NotificationItem | null>(null)
  const [error, setError] = useState<any>(null)
  const subscriptionRef = useRef<any>(null)

  useEffect(() => {
    if (!userId) return

    // Clean up previous subscription if exists
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
    }

    // Create new subscription
    try {
      subscriptionRef.current = (gqlClient
        .graphql({
          query: ON_NEW_NOTIFICATION,
          variables: { userId }
        }) as any)
        .subscribe({
          next: ({ data }: any) => {
            const newNotification = data?.onNewNotification
            if (newNotification) {
              setSubscriptionData(newNotification)
            }
          },
          error: (err: any) => {
            console.error('Subscription error:', err)
            setError(err)
          }
        })
    } catch (err) {
      console.error('Failed to create subscription:', err)
      setError(err)
    }

    // Cleanup on unmount or userId change
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [userId])

  return {
    subscriptionData,
    error
  }
}

// Combined hook that provides all notification functionality
export function useNotifications(userId?: string) {
  const listHook = useListNotifications()
  const updateHook = useUpdateNotification()
  const subscriptionHook = useNotificationSubscription(userId)

  // Calculate unread count
  const unreadCount = listHook.notifications.filter(
    n => n.isSeenStatus === 'UNSEEN'
  ).length

  // When new notification arrives, add it to the list
  useEffect(() => {
    if (subscriptionHook.subscriptionData) {
      listHook.setNotifications(prev => [
        subscriptionHook.subscriptionData as NotificationItem,
        ...prev
      ])
    }
  }, [subscriptionHook.subscriptionData])

  return {
    ...listHook,
    ...updateHook,
    unreadCount,
    newNotification: subscriptionHook.subscriptionData,
    subscriptionError: subscriptionHook.error
  }
}
