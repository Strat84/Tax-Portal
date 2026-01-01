import { cn } from '@/lib/utils'

export type UserStatus = 'online' | 'away' | 'offline'

interface StatusDotProps {
  status: UserStatus
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Simple status indicator dot
 * - Green: online
 * - Yellow: away
 * - Gray: offline
 */
export default function StatusDot({ status, size = 'md', className }: StatusDotProps) {
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  }

  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    offline: 'bg-gray-400'
  }

  return (
    <span
      className={cn(
        'rounded-full inline-block',
        sizeClasses[size],
        statusColors[status],
        className
      )}
      aria-label={`Status: ${status}`}
    />
  )
}
