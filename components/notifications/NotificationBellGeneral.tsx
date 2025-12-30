'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAllNotifications } from '@/hooks/useAllNotifications'
import { NotificationPanelGeneral } from './NotificationPanelGeneral'
import { Notification } from '@/types/notifications-general'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function NotificationBellGeneral() {
  const router = useRouter()
  const { notifications, unreadCount, loading, refetch } = useAllNotifications()
  const [isAnimating, setIsAnimating] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [prevUnreadCount, setPrevUnreadCount] = useState(0)

  // Animate badge when unread count changes
  useEffect(() => {
    if (unreadCount > prevUnreadCount) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 600)
      return () => clearTimeout(timer)
    }
    setPrevUnreadCount(unreadCount)
  }, [unreadCount, prevUnreadCount])

  // Refetch notifications periodically (every 10 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      refetch()
    }, 10000)
    return () => clearInterval(interval)
  }, [refetch])

  const handleSelectNotification = (notification: Notification) => {
    // Handle navigation based on notification type
    switch (notification.type) {
      case 'message':
        router.push(`/dashboard/messages?conversation=${notification.metadata?.conversationId}`)
        break
      case 'document':
        router.push(`/dashboard/documents?id=${notification.metadata?.documentId}`)
        break
      case 'task':
        router.push(`/dashboard/tasks?id=${notification.metadata?.taskId}`)
        break
      case 'system':
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
              {unreadCount > 99 ? '99+' : unreadCount}
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
