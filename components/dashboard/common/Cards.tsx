'use client'

import { Badge } from '@/components/ui/badge'
import { DashboardMessage } from '@/lib/dashboard/types'
import { formatRelativeTime } from '@/lib/dashboard/utils'

/**
 * Message Card Component
 * Displays a single message in a card format
 */
interface MessageCardProps {
  message: DashboardMessage
  onClick?: () => void
  className?: string
}

export function MessageCard({ message, onClick, className = '' }: MessageCardProps) {
  return (
    <div
      onClick={onClick}
      className={`p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
        message.unread ? 'bg-blue-50 dark:bg-blue-950/20' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm">{message.from}</p>
          {message.unread && <Badge variant="default" className="text-xs">
            New
          </Badge>}
        </div>
        <span className="text-xs text-muted-foreground">{message.date}</span>
      </div>
      <p className="text-sm font-medium mb-1">{message.subject}</p>
      <p className="text-sm text-muted-foreground line-clamp-2">{message.preview}</p>
    </div>
  )
}

/**
 * Activity Item Component
 * Displays a single activity in a list
 */
interface ActivityItemProps {
  icon: string
  user: string
  action: string
  time: string
  className?: string
}

export function ActivityItem({ icon, user, action, time, className = '' }: ActivityItemProps) {
  return (
    <div className={`flex items-start gap-4 p-3 border border-slate-200 dark:border-slate-700 rounded-lg ${className}`}>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-medium">{user}</span> <span className="text-muted-foreground">{action}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">{time}</p>
      </div>
    </div>
  )
}

/**
 * Status Badge Component
 * Displays a status with appropriate styling
 */
interface StatusBadgeProps {
  status: string
  colorClass: string
  label?: string
}

export function StatusBadge({ status, colorClass, label }: StatusBadgeProps) {
  return (
    <Badge className={colorClass} variant="outline">
      {label || status}
    </Badge>
  )
}

/**
 * Priority Badge Component
 */
interface PriorityBadgeProps {
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  className?: string
}

export function PriorityBadge({ priority, className = '' }: PriorityBadgeProps) {
  const colorMap: Record<string, string> = {
    LOW: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20',
    NORMAL: 'bg-slate-100 text-slate-800 dark:bg-slate-900/20',
    HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20',
    URGENT: 'bg-red-100 text-red-800 dark:bg-red-900/20',
  }

  return (
    <Badge className={`${colorMap[priority]} ${className}`} variant="outline">
      {priority.toLowerCase()}
    </Badge>
  )
}

/**
 * Date Display Component
 * Formats and displays a date
 */
interface DateDisplayProps {
  date: string | Date
  format?: 'short' | 'long' | 'relative'
  className?: string
}

export function DateDisplay({ date, format = 'short', className = '' }: DateDisplayProps) {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  let displayText = ''
  if (format === 'relative') {
    displayText = formatRelativeTime(dateObj)
  } else if (format === 'short') {
    displayText = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } else {
    displayText = dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    })
  }

  return <span className={className}>{displayText}</span>
}

/**
 * Health Status Indicator
 */
interface HealthStatusProps {
  label: string
  description: string
  status: 'healthy' | 'warning' | 'critical'
}

export function HealthStatus({ label, description, status }: HealthStatusProps) {
  const dotColor = {
    healthy: 'bg-green-500',
    warning: 'bg-yellow-500',
    critical: 'bg-red-500',
  }[status]

  const badgeColor = {
    healthy: 'bg-green-100 text-green-800 dark:bg-green-900/20',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/20',
  }[status]

  const statusLabel = {
    healthy: 'Healthy',
    warning: 'Warning',
    critical: 'Critical',
  }[status]

  return (
    <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`h-3 w-3 rounded-full ${dotColor}`} />
        <div>
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Badge variant="secondary" className={badgeColor}>
        {statusLabel}
      </Badge>
    </div>
  )
}
