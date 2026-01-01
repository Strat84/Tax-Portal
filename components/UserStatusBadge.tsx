import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import StatusDot, { UserStatus } from './StatusDot'
import { cn } from '@/lib/utils'

interface UserStatusBadgeProps {
  user: {
    name: string
    avatar?: string
    status: UserStatus
  }
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Avatar component with status dot overlay at bottom-right
 * Displays user avatar with their online/away/offline status
 */
export default function UserStatusBadge({ user, size = 'md', className }: UserStatusBadgeProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  }

  const dotSizes = {
    sm: 'sm' as const,
    md: 'sm' as const,
    lg: 'md' as const
  }

  const dotPositions = {
    sm: 'bottom-0 right-0',
    md: 'bottom-0 right-0',
    lg: 'bottom-0.5 right-0.5'
  }

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className={cn('relative inline-block', className)}>
      <Avatar className={sizeClasses[size]}>
        {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
        <AvatarFallback className="bg-primary text-primary-foreground">
          {getInitials(user.name)}
        </AvatarFallback>
      </Avatar>

      {/* Status dot with white border ring for visibility */}
      <div
        className={cn(
          'absolute ring-2 ring-background rounded-full',
          dotPositions[size]
        )}
      >
        <StatusDot status={user.status} size={dotSizes[size]} />
      </div>
    </div>
  )
}
