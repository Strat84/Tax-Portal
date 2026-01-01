import { Button } from '@/components/ui/button'
import StatusDot, { UserStatus } from './StatusDot'
import { cn } from '@/lib/utils'

interface StatusControlsProps {
  currentStatus: UserStatus
  onStatusChange: (status: UserStatus) => void
  className?: string
}

/**
 * Manual status toggle controls
 * Allows users to set their status as online, away, or offline
 */
export default function StatusControls({ currentStatus, onStatusChange, className }: StatusControlsProps) {
  const statuses: { value: UserStatus; label: string; description: string }[] = [
    { value: 'online', label: 'Available', description: 'You will appear online to others' },
    { value: 'away', label: 'Away', description: 'You will appear as away' },
    { value: 'offline', label: 'Invisible', description: 'You will appear offline to others' }
  ]

  return (
    <div className={cn('space-y-1', className)}>
      <div className="px-2 py-1.5">
        <p className="text-xs font-medium text-muted-foreground">Set your status</p>
      </div>

      {statuses.map(({ value, label, description }) => (
        <button
          key={value}
          onClick={() => onStatusChange(value)}
          className={cn(
            'w-full flex items-center gap-3 px-2 py-2 rounded-sm text-sm transition-colors',
            'hover:bg-accent hover:text-accent-foreground',
            currentStatus === value && 'bg-accent text-accent-foreground'
          )}
        >
          <StatusDot status={value} size="md" />
          <div className="flex-1 text-left">
            <div className="font-medium">{label}</div>
            <div className="text-xs text-muted-foreground">{description}</div>
          </div>
          {currentStatus === value && (
            <svg
              className="h-4 w-4 text-primary"
              fill="none"
              strokeWidth="2"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      ))}
    </div>
  )
}
