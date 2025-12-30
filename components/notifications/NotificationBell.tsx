'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/hooks/useNotifications'
import { NotificationPanel } from './NotificationPanel'
import { MessageNotification } from '@/types/notifications'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function NotificationBell() {
  const router = useRouter()
  const { notifications, stats, loading, refetch } = useNotifications()
  const [selectedNotification, setSelectedNotification] = useState<MessageNotification | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  // Animate badge when unread count changes
  useEffect(() => {
    if (stats.totalUnread > 0) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 600)
      return () => clearTimeout(timer)
    }
  }, [stats.totalUnread])

  // Refetch notifications periodically (every 10 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      refetch()
    }, 10000)
    return () => clearInterval(interval)
  }, [refetch])

  const handleSelectNotification = (notification: MessageNotification) => {
    setSelectedNotification(notification)
    // Navigate to the specific conversation
    router.push(`/dashboard/messages?conversation=${notification.conversationId}`)
    setIsOpen(false)
  }

  const handleMarkAllAsRead = () => {
    // TODO: Implement marking all as read
    refetch()
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
          {stats.totalUnread > 0 && (
            <span
              className={`absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center border-2 border-white dark:border-slate-900 ${isAnimating ? 'animate-pulse' : ''}`}
            >
              {stats.totalUnread > 99 ? '99+' : stats.totalUnread}
            </span>
          )}

          {/* Pulse animation ring */}
          {stats.totalUnread > 0 && isAnimating && (
            <span className="absolute inset-0 animate-ping rounded-full bg-red-500 opacity-75" />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="p-0 w-full max-w-sm">
        <NotificationPanel
          notifications={notifications}
          stats={stats}
          loading={loading}
          onSelectNotification={handleSelectNotification}
          onMarkAllAsRead={handleMarkAllAsRead}
          selectedNotificationId={selectedNotification?.id}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
