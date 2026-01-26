'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/hooks/useNotification'
import { NotificationPanelGeneral } from './NotificationPanelGeneral'
import { NotificationItem } from '@/graphql/types/notification'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Extract folder path from fullPath field for navigation
// Example: private/userId/folder1/file.png -> userId/folder1/
const extractFolderPathFromFullPath = (fullPath: string): string => {
  // Remove 'private/' prefix
  let path = fullPath.replace(/^private\//, '')

  // Remove filename (last part after last /)
  const lastSlashIndex = path.lastIndexOf('/')
  if (lastSlashIndex !== -1) {
    path = path.substring(0, lastSlashIndex + 1) // Keep the trailing slash
  }

  return path
}

export function NotificationBellGeneral() {
  const router = useRouter()
  const { user } = useAuth()
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    updateNotification,
    setNotifications
  } = useNotifications(user?.id)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [prevUnreadCount, setPrevUnreadCount] = useState(0)

  // Fetch initial 10 notifications
  useEffect(() => {
    if (user?.id) {
      fetchNotifications(10)
    }
  }, [user?.id, fetchNotifications])

  // Animate badge when unread count changes
  useEffect(() => {
    if (unreadCount > prevUnreadCount) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 600)
      return () => clearTimeout(timer)
    }
    setPrevUnreadCount(unreadCount)
  }, [unreadCount, prevUnreadCount])

  // Refetch notifications periodically (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      if (user?.id) {
        fetchNotifications(10)
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [user?.id, fetchNotifications])

  const handleSelectNotification = async (notification: NotificationItem) => {
    // Update notification to SEEN if it's UNSEEN
    if (notification.isSeenStatus === 'UNSEEN') {
      try {
        await updateNotification(notification.PK, notification.SK, 'SEEN')

        // Update local state immediately to reflect the change
        setNotifications(prev =>
          prev.map(n =>
            n.notificationId === notification.notificationId
              ? { ...n, isSeenStatus: 'SEEN' as const }
              : n
          )
        )
      } catch (err) {
        console.error('Failed to update notification:', err)
      }
    }

    // Handle navigation based on notification type
    switch (notification.type) {
      case 'MESSAGE':
        if (notification.conversationId) {
          router.push(`/messages?conversation=${notification.conversationId}`)
        }
        break
      case 'FILE':
        if (notification.fullPath) {
          // Extract folder path from fullPath field
          // fullPath: private/userId/folder1/file.png -> userId/folder1/
          const folderPath = extractFolderPathFromFullPath(notification.fullPath)
          router.push(`/documents/${folderPath}`)
        }
        break
      case 'SYSTEM':
        router.push('/notifications')
        break
      default:
        router.push('/notifications')
    }
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Notifications"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 text-slate-700 dark:text-slate-300"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>

          {/* Unread badge */}
          {unreadCount > 0 && (
            <span
              className={`absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center border-2 border-white dark:border-slate-900 ${
                isAnimating ? 'animate-pulse' : ''
              }`}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}

          {/* Pulse animation ring */}
          {unreadCount > 0 && isAnimating && (
            <span className="absolute inset-0 animate-ping rounded-full bg-red-500 opacity-75" />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="p-0 w-full max-w-sm">
        <NotificationPanelGeneral
          notifications={notifications}
          unreadCount={unreadCount}
          loading={loading}
          onSelectNotification={handleSelectNotification}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
