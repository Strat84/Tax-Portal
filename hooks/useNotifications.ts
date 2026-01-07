'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import useConversations from '@/hooks/useConversations'
import { MessageNotification, NotificationStats } from '@/types/notifications'

export function useNotifications() {
  const { user } = useAuth()
  const { conversations, loading, refetch } = useConversations()
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
        const otherUser = user?.id === conv.user1Id ? conv.user2 : conv.user1
        const otherUserId = otherUser.id
        const otherUserName = otherUser.name


        return {
          id: conv.conversationId,
          conversationId: conv.conversationId,
          user: {
            id: otherUserId,
            name: otherUserName || 'Unknown',
            email: otherUser.email || '',
            status: otherUser.status || 'offline',
            isStarred: false,
          },
          lastMessage: {
            id: conv.conversationId,
            conversationId: conv.conversationId,
            senderId: otherUserId,
            senderName: otherUserName || 'Unknown',
            senderEmail: otherUser.email || '',
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
