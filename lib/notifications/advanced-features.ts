'use client'

import { useState, useCallback } from 'react'
import { MessageNotification } from '@/types/notifications'

/**
 * Advanced notification features for the notification bell system
 */

// Real-time typing indicators
const typingIndicators = new Map<string, boolean>()

export function useTypingIndicators() {
  const [typing, setTyping] = useState<Map<string, boolean>>(new Map())

  const setTyping_ = useCallback((conversationId: string, isTyping: boolean) => {
    setTyping(prev => {
      const newMap = new Map(prev)
      newMap.set(conversationId, isTyping)
      return newMap
    })
  }, [])

  return { typing, setTyping: setTyping_ }
}

// Notification priorities
export const notificationPriorities = {
  normal: 0,
  pending_response: 1,
  starred: 2,
  urgent: 3,
}

export function sortNotificationsByPriority(notifications: MessageNotification[]) {
  return [...notifications].sort((a, b) => {
    const priorityA = notificationPriorities[a.lastMessage.priority]
    const priorityB = notificationPriorities[b.lastMessage.priority]
    return priorityB - priorityA
  })
}

// Filter notifications
export function filterNotifications(
  notifications: MessageNotification[],
  filter: 'all' | 'unread' | 'starred' | 'urgent'
) {
  switch (filter) {
    case 'unread':
      return notifications.filter(n => n.unreadCount > 0)
    case 'starred':
      return notifications.filter(n => n.isPinned)
    case 'urgent':
      return notifications.filter(n => n.lastMessage.priority === 'urgent' || n.hasUnresolvedQuery)
    default:
      return notifications
  }
}

// Search notifications
export function searchNotifications(notifications: MessageNotification[], query: string) {
  const lowerQuery = query.toLowerCase()
  return notifications.filter(
    n =>
      n.user.name.toLowerCase().includes(lowerQuery) ||
      n.lastMessage.content.toLowerCase().includes(lowerQuery)
  )
}

// Delivery status management
export const deliveryStatuses = {
  sent: '✓',
  delivered: '✓✓',
  read: '✓✓',
}

// Read receipt tracking
export interface ReadReceipt {
  conversationId: string
  userId: string
  timestamp: string
}

// Notification sound (optional)
export function playNotificationSound() {
  if (typeof window !== 'undefined') {
    const audio = new Audio('/notification.mp3')
    audio.play().catch(() => {
      // Silently fail if audio playback is blocked
    })
  }
}

// Desktop notifications (optional)
export function requestNotificationPermission() {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }
}

export function sendDesktopNotification(title: string, options?: NotificationOptions) {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(title, options)
  }
}

// Notification grouping
export function groupNotificationsByDate(notifications: MessageNotification[]) {
  const groups: { [key: string]: MessageNotification[] } = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: [],
  }

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  notifications.forEach(notif => {
    const notifDate = new Date(notif.timestamp)
    const notifDateOnly = new Date(notifDate.getFullYear(), notifDate.getMonth(), notifDate.getDate())

    if (notifDateOnly.getTime() === today.getTime()) {
      groups.today.push(notif)
    } else if (notifDateOnly.getTime() === yesterday.getTime()) {
      groups.yesterday.push(notif)
    } else if (notifDateOnly.getTime() >= weekAgo.getTime()) {
      groups.thisWeek.push(notif)
    } else {
      groups.older.push(notif)
    }
  })

  return groups
}
