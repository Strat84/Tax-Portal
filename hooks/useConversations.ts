'use client'

import { useEffect, useState, useCallback } from 'react'
import { gqlClient } from '@/lib/appsync/client'
import { GET_CONVERSATIONS } from '@/graphql/queries/conversation'
import { UPDATE_CONVERSATION } from '@/graphql/mutation/conversation'
import { Conversation, GetConversationsResponse, UpdateConversationResponse } from '@/graphql/types/conversation'
import { GraphQLResult } from '@aws-amplify/api-graphql'

interface UpdateConversationInput {
  PK: string
  SK: string
  unreadCount?: number
}

export default function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)
  const [updateLoading, setUpdateLoading] = useState(false)
  const [updateError, setUpdateError] = useState<any>(null)

  const fetchConversations = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await gqlClient.graphql({
        query: GET_CONVERSATIONS
      }) as GraphQLResult<GetConversationsResponse>

      setConversations(result.data?.getConversations || [])
      setLoading(false)
    } catch (err) {
      console.error('Error fetching conversations:', err)
      setError(err)
      setLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  const updateConversation = useCallback(async (input: UpdateConversationInput) => {
    setUpdateLoading(true)
    setUpdateError(null)

    // Optimistic update - update UI immediately
    setConversations(prev =>
      prev.map(conv =>
        conv.PK === input.PK && conv.SK === input.SK
          ? { ...conv, unreadCount: input.unreadCount ?? conv.unreadCount }
          : conv
      )
    )

    try {
      const result = await gqlClient.graphql({
        query: UPDATE_CONVERSATION,
        variables: { input }
      }) as GraphQLResult<UpdateConversationResponse>

      // Update with actual server response
      setConversations(prev =>
        prev.map(conv =>
          conv.PK === result.data?.updateConversation.PK &&
          conv.SK === result.data?.updateConversation.SK
            ? result.data.updateConversation
            : conv
        )
      )

      setUpdateLoading(false)
      return result.data?.updateConversation
    } catch (err) {
      console.error('Error updating conversation:', err)
      setUpdateError(err)
      setUpdateLoading(false)
      // Revert optimistic update on error
      await fetchConversations()
      throw err
    }
  }, [fetchConversations])

  return {
    conversations,
    loading,
    error,
    refetch: fetchConversations,
    updateConversation,
    updateLoading,
    updateError
  }
}
