'use client'

import { Card, CardContent } from '@/components/ui/card'

/**
 * Loading State Component
 * Displays a loading spinner with optional text
 */
interface LoadingStateProps {
  text?: string
}

export function LoadingState({ text = 'Loading...' }: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <Card className="w-full max-w-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <svg
              className="animate-spin h-5 w-5 text-primary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-sm font-medium">{text}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Error State Component
 * Displays an error message
 */
interface ErrorStateProps {
  message?: string
  title?: string
}

export function ErrorState({ message = 'An error occurred', title = 'Error' }: ErrorStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <Card className="w-full max-w-sm border-red-200 dark:border-red-900">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div>
              <p className="font-semibold text-red-900 dark:text-red-100">{title}</p>
              <p className="text-sm text-red-800 dark:text-red-200 mt-1">{message}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Empty State Component
 * Displays when no data is available
 */
interface EmptyStateProps {
  icon?: string
  title?: string
  message?: string
}

export function EmptyState({
  icon = '📭',
  title = 'No data',
  message = 'There is no data to display',
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="text-6xl mb-4">{icon}</div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground text-center max-w-xs">{message}</p>
      </CardContent>
    </Card>
  )
}

/**
 * Conditional Render Component
 * Renders loading, error, or empty state based on conditions
 */
interface ConditionalRenderProps {
  isLoading: boolean
  error?: string | null
  isEmpty: boolean
  loadingText?: string
  errorText?: string
  emptyText?: string
  emptyTitle?: string
  emptyIcon?: string
  children: React.ReactNode
}

export function ConditionalRender({
  isLoading,
  error,
  isEmpty,
  loadingText = 'Loading...',
  errorText,
  emptyText = 'No data available',
  emptyTitle = 'No data',
  emptyIcon = '📭',
  children,
}: ConditionalRenderProps) {
  if (isLoading) return <LoadingState text={loadingText} />
  if (error) return <ErrorState message={errorText || error} />
  if (isEmpty) return <EmptyState icon={emptyIcon} title={emptyTitle} message={emptyText} />
  return <>{children}</>
}
