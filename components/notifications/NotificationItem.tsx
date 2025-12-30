'use client'

import { MessageNotification } from '@/types/notifications'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface NotificationItemProps {
  notification: MessageNotification
  isSelected?: boolean
  onSelect: (notification: MessageNotification) => void
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

export function NotificationItem({
  notification,
  isSelected = false,
  onSelect,
}: NotificationItemProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'new_message':
        return 'bg-blue-500'
      case 'reply':
        return 'bg-green-500'
      case 'urgent':
        return 'bg-red-500'
      case 'system':
        return 'bg-yellow-500'
      default:
        return 'bg-slate-500'
    }
  }

  const getAttachmentIcon = (attachmentType?: string) => {
    switch (attachmentType) {
      case 'document':
        return '📄'
      case 'image':
        return '📷'
      case 'file':
        return '📎'
      case 'attachment':
        return '📎'
      default:
        return '💬'
    }
  }

  const getStatusColor = (status: string) => {
    return status === 'online' ? 'bg-green-500' : 'bg-slate-400'
  }

  const truncateMessage = (text: string, length: number = 50) => {
    return text.length > length ? text.substring(0, length) + '...' : text
  }

  const relativeTime = formatTime(notification.timestamp)

  return (
    <button
      onClick={() => onSelect(notification)}
      className={`w-full px-4 py-3 text-left transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800 border-l-4 ${
        isSelected
          ? 'bg-blue-50 dark:bg-slate-800 border-l-blue-500'
          : notification.unreadCount > 0
            ? 'bg-blue-50/50 dark:bg-slate-800/50 border-l-blue-400'
            : 'border-l-transparent'
      }`}
    >
      <div className="flex gap-3">
        {/* Avatar with status indicator */}
        <div className="relative flex-shrink-0">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {notification.user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {/* Online status dot */}
          <div
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${getStatusColor(notification.user.status)}`}
          />
        </div>

        {/* Message content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                {notification.user.name}
              </h4>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {getAttachmentIcon(notification.lastMessage.attachmentType)}
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                  {truncateMessage(notification.lastMessage.content)}
                </p>
              </div>
            </div>

            {/* Unread count badge */}
            {notification.unreadCount > 0 && (
              <div className="flex-shrink-0 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-semibold">
                  {notification.unreadCount > 99 ? '99+' : notification.unreadCount}
                </span>
              </div>
            )}
          </div>

          {/* Timestamp */}
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{relativeTime}</p>

          {/* Priority/Type indicators */}
          <div className="flex items-center gap-1 mt-2">
            <div
              className={`w-2 h-2 rounded-full ${getTypeColor(notification.type)}`}
              title={notification.type}
            />
            {notification.isPinned && <span className="text-xs text-yellow-600 dark:text-yellow-400">📌 Pinned</span>}
            {notification.hasUnresolvedQuery && (
              <span className="text-xs text-red-600 dark:text-red-400">⚠️ Unresolved</span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}
