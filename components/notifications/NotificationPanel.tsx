'use client'

import { MessageNotification } from '@/types/notifications'
import { NotificationItem } from './NotificationItem'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'

interface NotificationPanelProps {
  notifications: MessageNotification[]
  stats: {
    totalUnread: number
    newMessages: number
    replies: number
    urgent: number
    system: number
  }
  loading?: boolean
  onSelectNotification: (notification: MessageNotification) => void
  onMarkAllAsRead: () => void
  selectedNotificationId?: string
}

export function NotificationPanel({
  notifications,
  stats,
  loading = false,
  onSelectNotification,
  onMarkAllAsRead,
  selectedNotificationId,
}: NotificationPanelProps) {
  const hasUnread = stats.totalUnread > 0

  return (
    <div className="w-full max-w-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-slate-700">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Messages</h2>
          {hasUnread && (
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
              {stats.totalUnread} unread message{stats.totalUnread !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {hasUnread && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkAllAsRead}
            className="text-xs h-8 px-2 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Mark all read
          </Button>
        )}
      </div>

      {/* Notification Stats (when there are unread items) */}
      {hasUnread && (
        <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="flex flex-col items-center">
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {stats.newMessages}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">New</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {stats.replies}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Replies</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-lg font-bold text-red-600 dark:text-red-400">
                {stats.urgent}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Urgent</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                {stats.system}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">System</p>
            </div>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full py-8">
            <div className="text-center">
              <div className="inline-block animate-spin">
                <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-700 border-t-blue-500 rounded-full" />
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Loading messages...</p>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex items-center justify-center h-full py-8">
            <div className="text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">No messages yet</p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                Start a conversation to see messages here
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                isSelected={selectedNotificationId === notification.id}
                onSelect={onSelectNotification}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <Separator />
      <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
        <Link href="/dashboard/messages" className="block w-full">
          <Button
            variant="outline"
            className="w-full justify-center text-sm h-9 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            View all messages
          </Button>
        </Link>
      </div>
    </div>
  )
}
