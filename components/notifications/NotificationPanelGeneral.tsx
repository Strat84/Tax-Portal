'use client'

import { NotificationItem } from '@/graphql/types/notification'
import { NotificationItemGeneral } from './NotificationItemGeneral'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'

interface NotificationPanelGeneralProps {
  notifications: NotificationItem[]
  unreadCount: number
  loading?: boolean
  onSelectNotification: (notification: NotificationItem) => void
}

export function NotificationPanelGeneral({
  notifications,
  unreadCount,
  loading = false,
  onSelectNotification,
}: NotificationPanelGeneralProps) {
  return (
    <div className="w-full max-w-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Notifications
        </h2>
        {unreadCount > 0 && (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full py-8">
            <div className="text-center">
              <div className="inline-block animate-spin">
                <div className="w-6 h-6 border-3 border-slate-200 dark:border-slate-700 border-t-blue-500 rounded-full" />
              </div>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                Loading...
              </p>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex items-center justify-center h-full py-12">
            <div className="text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                No notifications yet
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                Check back soon for updates
              </p>
            </div>
          </div>
        ) : (
          <div>
            {notifications.map((notification) => (
              <NotificationItemGeneral
                key={notification.notificationId}
                notification={notification}
                onSelect={onSelectNotification}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <Separator />
      <div className="px-4 py-3">
        <Link href="/notifications" className="block w-full">
          <Button
            variant="outline"
            className="w-full justify-center text-sm h-9 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            View All
          </Button>
        </Link>
      </div>
    </div>
  )
}
