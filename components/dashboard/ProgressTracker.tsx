'use client'

import { Separator } from '@/components/ui/separator'
import { CardSection } from './common/Headers'
import { StatusStep } from '@/lib/dashboard/types'
import { TAX_RETURN_STATUS_DESCRIPTIONS } from '@/lib/dashboard/constants'

/**
 * Tax Return Status Progress Tracker
 * Displays visual progress of tax return through various stages
 */
interface ProgressTrackerProps {
  currentStatus: string
  statusSteps: StatusStep[]
  className?: string
}

export function ProgressTracker({ currentStatus, statusSteps, className = '' }: ProgressTrackerProps) {
  const currentStepIndex = statusSteps.findIndex((step) => step.key === currentStatus)

  const getStatusDescription = (status: string): string => {
    return TAX_RETURN_STATUS_DESCRIPTIONS[status] || 'Processing your tax return'
  }

  return (
    <CardSection title="Tax Return Status" description="Your tax professional is currently working on your 2025 tax return" className={className}>
      <div className="space-y-4">
        {/* Progress Bar */}
        <div className="flex items-center gap-1">
          {statusSteps.map((step, index) => {
            const isColored = index <= currentStepIndex
            const isActive = index === currentStepIndex

            return (
              <div key={step.key} className="flex-1 flex items-center gap-1">
                {/* Step bar */}
                <div
                  className={`flex-1 h-2 rounded-full transition-all ${
                    isColored ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                />

                {/* Label */}
                <span
                  className={`text-xs text-center transition-all whitespace-nowrap px-1 ${
                    isColored ? 'text-primary font-medium' : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>

        <Separator />

        {/* Status Description */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Current Status:</strong> {getStatusDescription(currentStatus)}
          </p>
        </div>
      </div>
    </CardSection>
  )
}

/**
 * Deadline Alert Component
 * Shows critical deadline information
 */
interface DeadlineAlertProps {
  daysRemaining: number
  deadline: {
    label: string
    date: string
  }
  isInternal?: boolean
}

export function DeadlineAlert({ daysRemaining, deadline, isInternal = false }: DeadlineAlertProps) {
  const style = isInternal
    ? {
        bg: 'bg-yellow-100 dark:bg-yellow-950/40',
        border: 'border-l-4 border-yellow-500 dark:border-yellow-600',
        title: 'text-yellow-900 dark:text-yellow-200',
        text: 'text-yellow-800 dark:text-yellow-300',
        icon: '⚠️',
      }
    : {
        bg: 'bg-red-100 dark:bg-red-950/40',
        border: 'border-l-4 border-red-500 dark:border-red-600',
        title: 'text-red-900 dark:text-red-200',
        text: 'text-red-800 dark:text-red-300',
        icon: '🗓️',
      }

  return (
    <div className={`${style.bg} ${style.border} p-4 rounded`}>
      <p className={`text-sm font-semibold ${style.title} mb-2`}>
        {style.icon} {deadline.label}
      </p>
      <p className={`text-sm ${style.text}`}>
        {deadline.date}
        <br />
        <span className="text-xs mt-2 block">({daysRemaining} days remaining)</span>
      </p>
    </div>
  )
}

/**
 * Reassurance Message Component
 */
export function ReassuranceMessage() {
  return (
    <div className="bg-green-100 dark:bg-green-950/40 border-l-4 border-green-500 dark:border-green-600 p-4 rounded">
      <p className="text-sm font-semibold text-green-900 dark:text-green-200 mb-2">
        ✓ We've Got Your Back
      </p>
      <p className="text-sm text-green-800 dark:text-green-300">
        If you miss the April 1st internal deadline, we will extend the tax return filing to ensure you avoid any late filing penalties from the IRS. Your compliance is our priority.
      </p>
    </div>
  )
}

/**
 * Deadline Section Component
 * Combines deadline alerts and reassurance message
 */
interface DeadlineSectionProps {
  daysUntilDeadline: number
  daysUntilInternalDeadline: number
}

export function DeadlineSection({ daysUntilDeadline, daysUntilInternalDeadline }: DeadlineSectionProps) {
  return (
    <CardSection>
      <div className="space-y-6">
        {/* Internal Deadline Warning */}
        <DeadlineAlert
          daysRemaining={daysUntilInternalDeadline}
          deadline={{
            label: 'Important Internal Deadline',
            date: 'All documents need to be completed by April 1st, 2026',
          }}
          isInternal={true}
        />

        {/* Reassurance Message */}
        <ReassuranceMessage />
      </div>
    </CardSection>
  )
}
