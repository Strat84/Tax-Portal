'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useConversations } from '@/hooks/useMessages'
import { MessageNotification, NotificationStats } from '@/types/notifications'

export function useNotifications() {
  const { user } = useAuth()
  const { conversations, loading, refetch } = useConversations(user?.id || null, user?.role || null)
  const [notifications, setNotifications] = useState<MessageNotification[]>([])
  const [stats, setStats] = useState<NotificationStats>({
    totalUnread: 0,
    newMessages: 0,
    replies: 0,
    urgent: 0,
    system: 0,
  })

  // Transform conversations to notifications
  useEffect(() => {
    if (conversations && conversations.length > 0) {
      const notifs = conversations.map((conv) => {
        // Determine the other user
        const otherUserId = user?.id === conv.clientUserId ? conv.taxProUserId : conv.clientUserId
        const otherUserName = user?.id === conv.clientUserId ? conv.taxProName : conv.clientName
        
        
        return {
          id: conv.id,
          conversationId: conv.id,
          user: {
            id: otherUserId,
            name: otherUserName || 'Unknown',
            email: '',
            status: 'online' as const,
            isStarred: false,
          },
          lastMessage: {
            id: conv.id,
            conversationId: conv.id,
            senderId: '',
            senderName: otherUserName || 'Unknown',
            senderEmail: '',
            content: conv.lastMessage || 'No messages yet',
            createdAt: conv.lastMessageAt || new Date().toISOString(),
            isRead: false,
            deliveryStatus: 'delivered' as const,
            priority: 'normal' as const,
          },
          unreadCount: conv.unreadCount || 0,
          timestamp: conv.lastMessageAt || new Date().toISOString(),
          type: 'new_message' as const,
          isPinned: false,
          hasUnresolvedQuery: false,
        }
      })

      setNotifications(notifs)

      // Calculate stats
      const totalUnread = notifs.reduce((sum, n) => sum + n.unreadCount, 0)
      setStats({
        totalUnread,
        newMessages: notifs.filter(n => n.type === 'new_message').length,
        replies: 0,
        urgent: 0,
        system: 0,
      })
    }
  }, [conversations, user?.id])

  return {
    notifications,
    stats,
    loading,
    refetch,
  }
}
