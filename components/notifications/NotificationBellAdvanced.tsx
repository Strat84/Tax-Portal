'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/hooks/useNotifications'
import { NotificationPanel } from './NotificationPanel'
import { MessageNotification } from '@/types/notifications'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import {
  sortNotificationsByPriority,
  filterNotifications,
  searchNotifications,
  sendDesktopNotification,
  playNotificationSound,
} from '@/lib/notifications/advanced-features'

export function NotificationBellAdvanced() {
  const router = useRouter()
  const { notifications, stats, loading, refetch } = useNotifications()
  const [selectedNotification, setSelectedNotification] = useState<MessageNotification | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'starred' | 'urgent'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [lastUnreadCount, setLastUnreadCount] = useState(0)

  // Animate badge when unread count changes
  useEffect(() => {
    if (stats.totalUnread > lastUnreadCount) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 600)
      
      // Play sound and send desktop notification on new message
      playNotificationSound()
      const newMessageCount = stats.totalUnread - lastUnreadCount
      sendDesktopNotification('New Message', {
        body: `You have ${newMessageCount} new message${newMessageCount > 1 ? 's' : ''}`,
        icon: '/tax-portal-icon.png',
      })
      
      return () => clearTimeout(timer)
    }
    setLastUnreadCount(stats.totalUnread)
  }, [stats.totalUnread, lastUnreadCount])

  // Refetch notifications periodically (every 5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      refetch()
    }, 5000)
    return () => clearInterval(interval)
  }, [refetch])

  const handleSelectNotification = (notification: MessageNotification) => {
    setSelectedNotification(notification)
    router.push(`/dashboard/messages?conversation=${notification.conversationId}`)
    setIsOpen(false)
  }

  const handleMarkAllAsRead = () => {
    refetch()
  }

  // Filter and sort notifications
  let displayedNotifications = filterNotifications(notifications, filterType)
  if (searchQuery) {
    displayedNotifications = searchNotifications(displayedNotifications, searchQuery)
  }
  displayedNotifications = sortNotificationsByPriority(displayedNotifications)

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Messages"
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
              className={`absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center border-2 border-white dark:border-slate-900 ${
                isAnimating ? 'animate-pulse' : ''
              }`}
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
        <div className="w-full max-w-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Messages</h2>
              {stats.totalUnread > 0 && (
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                  {stats.totalUnread} unread
                </p>
              )}
            </div>
            {stats.totalUnread > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs h-8 px-2 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Mark read
              </Button>
            )}
          </div>

          {/* Search Bar */}
          <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1 px-3 py-2 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
            {['all', 'unread', 'starred', 'urgent'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterType(tab as any)}
                className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                  filterType === tab
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <NotificationPanel
            notifications={displayedNotifications}
            stats={stats}
            loading={loading}
            onSelectNotification={handleSelectNotification}
            onMarkAllAsRead={handleMarkAllAsRead}
            selectedNotificationId={selectedNotification?.id}
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
