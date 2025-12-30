'use client'

import { useAllNotifications } from '@/hooks/useAllNotifications'
import { Notification } from '@/types/notifications-general'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'message':
      return '💬'
    case 'document':
      return '📄'
    case 'system':
      return '⚡'
    case 'task':
      return '✅'
    default:
      return '🔔'
  }
}

const getNotificationTypeLabel = (type: string) => {
  switch (type) {
    case 'message':
      return 'Message'
    case 'document':
      return 'Document'
    case 'system':
      return 'System Alert'
    case 'task':
      return 'Task'
    default:
      return 'Notification'
  }
}

const formatTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString()
}

export default function NotificationsPage() {
  const { notifications, unreadCount, loading } = useAllNotifications()
  const router = useRouter()

  const handleNotificationClick = (notification: Notification) => {
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
        // System notifications stay on this page
        break
      default:
        break
    }
  }

  const unreadNotifications = notifications.filter(n => n.status === 'unread')
  const readNotifications = notifications.filter(n => n.status === 'read')

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                Notifications
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin">
                <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-700 border-t-blue-500 rounded-full" />
              </div>
              <p className="mt-4 text-slate-600 dark:text-slate-400">Loading notifications...</p>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-lg text-slate-600 dark:text-slate-400">No notifications yet</p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                Check back soon for updates
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Unread Notifications */}
            {unreadNotifications.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide mb-4">
                  Unread ({unreadNotifications.length})
                </h2>
                <div className="space-y-3">
                  {unreadNotifications.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Read Notifications */}
            {readNotifications.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide mb-4">
                  Earlier
                </h2>
                <div className="space-y-3">
                  {readNotifications.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function NotificationCard({
  notification,
  onClick,
}: {
  notification: Notification
  onClick: () => void
}) {
  const isClickable = notification.type !== 'system'

  return (
    <button
      onClick={onClick}
      disabled={!isClickable}
      className={`w-full p-4 rounded-lg border transition-all duration-200 ${
        notification.status === 'unread'
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
      } ${
        isClickable
          ? 'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer'
          : 'cursor-default'
      } text-left`}
    >
      <div className="flex gap-4">
        {/* Status indicator */}
        <div className="flex-shrink-0 flex items-center pt-1">
          <div
            className={`w-3 h-3 rounded-full ${
              notification.status === 'unread' ? 'bg-blue-500' : 'bg-slate-400'
            }`}
          />
        </div>

        {/* Icon */}
        <div className="flex-shrink-0 flex items-center">
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-lg">
            {getNotificationIcon(notification.type)}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  {notification.title}
                </h3>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {getNotificationTypeLabel(notification.type)}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                {notification.description}
              </p>
            </div>
          </div>

          {/* Timestamp */}
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {formatTime(notification.timestamp)}
          </p>
        </div>

        {/* Arrow indicator for clickable items */}
        {isClickable && (
          <div className="flex-shrink-0 flex items-center text-slate-400 dark:text-slate-600">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        )}
      </div>
    </button>
  )
}
