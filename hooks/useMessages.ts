'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { gqlClient } from '@/lib/appsync/client'
import { GET_MESSAGES } from '@/graphql/queries/message'
import { CREATE_MESSAGE } from '@/graphql/mutation/message'
import { ON_NEW_MESSAGE } from '@/graphql/subscription/message'
import { GetMessagesResponse, Message } from '@/graphql/types/message'

interface UseMessagesProps {
  conversationId: string | null
  limit?: number
}

export function useConversationMessages({ conversationId, limit = 10 }: UseMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [nextToken, setNextToken] = useState<string | null>(null)
  const [initialLoading, setInitialLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<any>(null)
  const subscriptionRef = useRef<any>(null)

  const fetchMessages = useCallback(async (token: string | null = null, isLoadingMore: boolean = false) => {
    if (!conversationId) return

    // Set appropriate loading state
    if (isLoadingMore) {
      setLoadingMore(true)
    } else {
      setInitialLoading(true)
    }
    setError(null)

    try {
      const result = await gqlClient.graphql({
        query: GET_MESSAGES,
        variables: {
          conversationId,
          limit,
          nextToken: token
        }
      })

      const data = result.data?.getMessages

      if (token) {
        // Backend returns messages in descending order (newest first)
        // When loading more (older messages), append them to the end of array
        setMessages(prev => [...prev, ...(data?.items || [])])
      } else {
        // Replace messages if initial fetch
        setMessages(data?.items || [])
      }

      setNextToken(data?.nextToken || null)

      if (isLoadingMore) {
        setLoadingMore(false)
      } else {
        setInitialLoading(false)
      }
    } catch (err) {
      console.error('Error fetching messages:', err)
      setError(err)
      setInitialLoading(false)
      setLoadingMore(false)
    }
  }, [conversationId, limit])

  // Initial fetch
  useEffect(() => {
    if (conversationId) {
      fetchMessages(null, false)
    } else {
      setMessages([])
      setNextToken(null)
    }
  }, [conversationId, fetchMessages])

  // Subscribe to new messages
  useEffect(() => {
    if (!conversationId) {
      return
    }

    // Clean up previous subscription if exists
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
      subscriptionRef.current = null
    }


    try {
      // Create new subscription
      const subscription = gqlClient
        .graphql({
          query: ON_NEW_MESSAGE,
          variables: { conversationId }
        })
        .subscribe({
          next: ({ data }) => {
            const newMessage = data?.onNewMessage
            if (newMessage) {
              // Prepend new message (newest messages at start since array is in descending order)
              setMessages(prev => {
                // Check if message already exists to avoid duplicates
                const exists = prev.some(msg => msg.messageId === newMessage.messageId)
                if (exists) {
                  return prev
                }
                const updated = [newMessage, ...prev]
                return updated
              })
            } else {
              console.warn('⚠️ Received subscription event but no message data')
            }
          },
          error: (err) => {
            console.error('❌ Message subscription error:', {
              error: err,
              message: err.message || 'Unknown error',
              conversationId
            })
            // Log additional error details if available
            if (err.errors) {
              console.error('GraphQL Errors:', err.errors)
            }
          },
          complete: () => {
          }
        })

      subscriptionRef.current = subscription
    } catch (err) {
      console.error('❌ Failed to create subscription:', err)
    }

    // Cleanup on unmount or conversationId change
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
    }
  }, [conversationId])

  const loadMore = useCallback(async () => {
    if (nextToken && !loadingMore) {
      await fetchMessages(nextToken, true)
    }
  }, [nextToken, loadingMore, fetchMessages])

  const refetch = useCallback(async () => {
    await fetchMessages(null, false)
  }, [fetchMessages])

  return {
    messages,
    nextToken,
    loading: initialLoading,
    loadingMore,
    error,
    refetch,
    loadMore
  }
}

interface CreateMessageInput {
  GSI1PK: string
  GSI1SK: string
  content: string
  conversationId: string
  isSeenStatus: 'SEEN' | 'UNSEEN'
  receiverId: string
  messageType: 'TEXT' | 'FILE'
  senderId: string
  timestamp: string
}

export function useCreateMessage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)

  const createMessage = useCallback(async (input: CreateMessageInput) => {
    setLoading(true)
    setError(null)

    try {
      const result = await gqlClient.graphql({
        query: CREATE_MESSAGE,
        variables: {
          input
        }
      })

      setLoading(false)
      return result.data?.createMessage
    } catch (err) {
      console.error('Failed to create message:', err)
      setError(err)
      setLoading(false)
      throw err
    }
  }, [])

  return {
    createMessage,
    loading,
    error
  }
}
