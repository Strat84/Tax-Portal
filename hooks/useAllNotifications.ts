'use client'

import { useState, useEffect, useCallback } from 'react'
import { Notification } from '@/types/notifications-general'

export function useAllNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Mock data - replace with actual API calls
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'message',
          title: 'John Doe',
          description: 'Hey, I have a question about my tax return...',
          timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
          status: 'unread',
          userName: 'John Doe',
          userAvatar: 'JD',
          metadata: { conversationId: 'conv-1' },
        },
        {
          id: '2',
          type: 'document',
          title: 'W-2 Form Uploaded',
          description: 'Sarah Johnson uploaded W-2_2024.pdf',
          timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
          status: 'unread',
          fileName: 'W-2_2024.pdf',
          uploader: 'Sarah Johnson',
          metadata: { documentId: 'doc-1' },
        },
        {
          id: '3',
          type: 'system',
          title: 'Tax Deadline Reminder',
          description: 'Your quarterly tax payment is due in 5 days',
          timestamp: new Date(Date.now() - 1 * 3600000).toISOString(),
          status: 'unread',
        },
        {
          id: '4',
          type: 'task',
          title: 'Approval Needed',
          description: 'Review and approve client tax return',
          timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
          status: 'read',
          metadata: { taskId: 'task-1' },
        },
        {
          id: '5',
          type: 'message',
          title: 'Jane Smith',
          description: 'Thanks for your help with the documents',
          timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
          status: 'read',
          userName: 'Jane Smith',
          userAvatar: 'JS',
          metadata: { conversationId: 'conv-2' },
        },
      ]

      setNotifications(mockNotifications)
      setLoading(false)
    } catch (err: any) {
      console.error('Error fetching notifications:', err)
      setError(err.message || 'Failed to load notifications')
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const unreadCount = notifications.filter(n => n.status === 'unread').length

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refetch: fetchNotifications,
  }
}
