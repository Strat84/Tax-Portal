'use client'

import { Notification } from '@/types/notifications-general'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface NotificationItemProps {
  notification: Notification
  onSelect: (notification: Notification) => void
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

export function NotificationItemGeneral({
  notification,
  onSelect,
}: NotificationItemProps) {
  const handleClick = () => {
    onSelect(notification)
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full px-4 py-3 text-left transition-all duration-200 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 ${
        notification.status === 'unread'
          ? 'bg-blue-50/50 dark:bg-blue-900/20'
          : 'bg-white dark:bg-slate-900'
      }`}
    >
      <div className="flex gap-3">
        {/* Status dot */}
        <div className="flex-shrink-0 flex items-center">
          <div
            className={`w-2 h-2 rounded-full ${
              notification.status === 'unread' ? 'bg-blue-500' : 'bg-slate-400'
            }`}
          />
        </div>

        {/* Icon and content */}
        <div className="flex-1 min-w-0 flex gap-3">
          {/* Type icon and avatar */}
          <div className="flex-shrink-0">
            {notification.type === 'message' && notification.userAvatar ? (
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {notification.userAvatar}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm">
                {getNotificationIcon(notification.type)}
              </div>
            )}
          </div>

          {/* Notification content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                  {notification.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5">
                  {notification.description}
                </p>
              </div>
            </div>

            {/* Timestamp */}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {formatTime(notification.timestamp)}
            </p>
          </div>
        </div>
      </div>
    </button>
  )
}
