import { useState, useEffect } from 'react'
import { getConversations, getMessages, Conversation, Message } from '@/lib/api/messages'

export function useConversations(userId: string | null, userRole: string | null) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConversations = async () => {
    if (!userId || !userRole) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await getConversations(userId, userRole)
      setConversations(data)
    } catch (err: any) {
      console.error('Error in useConversations:', err)
      setError(err.message || 'Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [userId, userRole])

  return {
    conversations,
    loading,
    error,
    refetch: fetchConversations,
  }
}

export function useConversationMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMessages = async () => {
    if (!conversationId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await getMessages(conversationId)
      setMessages(data)
    } catch (err: any) {
      console.error('Error in useConversationMessages:', err)
      setError(err.message || 'Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [conversationId])

  return {
    messages,
    loading,
    error,
    refetch: fetchMessages,
  }
}
