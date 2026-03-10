/**
 * Dashboard Utilities
 * Common utility functions for dashboard operations
 */

/**
 * Format relative time (e.g., "5 minutes ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const pastDate = typeof date === 'string' ? new Date(date) : date
  const diffMs = now.getTime() - pastDate.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays === 1) return '1 day ago'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${diffDays > 7 ? 's' : ''} ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${diffDays > 30 ? 's' : ''} ago`
  return pastDate.toLocaleDateString()
}

/**
 * Format date to localized string
 */
export function formatDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('en-US', options || {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Calculate days until a specific date
 */
export function calculateDaysUntil(targetDate: Date): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const target = new Date(targetDate)
  target.setHours(0, 0, 0, 0)
  
  const diffMs = target.getTime() - today.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

/**
 * Calculate date from month/day of current year
 */
export function getDeadlineDate(month: number, day: number): Date {
  const year = new Date().getFullYear()
  return new Date(year, month, day)
}

/**
 * Get deadline status variant
 */
export function getDeadlineVariant(daysRemaining: number): 'danger' | 'warning' | 'success' {
  if (daysRemaining <= 7) return 'danger'
  if (daysRemaining <= 30) return 'warning'
  return 'success'
}

/**
 * Truncate text to length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

/**
 * Format document type name
 * E.g., "W2_FORM" -> "W2 Form"
 */
export function formatDocumentType(type: string): string {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

/**
 * Get color variant for stat card
 */
export function getStatVariant(value: number, threshold?: number): 'default' | 'success' | 'warning' | 'destructive' {
  if (threshold === undefined) return 'default'
  if (value === 0) return 'default'
  if (value >= threshold) return 'destructive'
  return 'warning'
}

/**
 * Format number with commas
 */
export function formatNumber(num: number | string): string {
  const numValue = typeof num === 'string' ? parseInt(num, 10) : num
  if (isNaN(numValue)) return '0'
  return numValue.toLocaleString('en-US')
}

/**
 * Parse status color class string
 */
export function parseStatusColor(colorClass: string): string {
  // Returns the color class as-is or provides a default
  return colorClass || 'bg-slate-100 text-slate-800'
}

/**
 * Filter and sort requests by status
 */
export function filterRequestsByStatus(
  requests: any[],
  status: string
): any[] {
  if (status === 'all') return requests
  return requests.filter((req) => req.status === status)
}

/**
 * Calculate percentage
 */
export function calculatePercentage(current: number, total: number): number {
  if (total === 0) return 0
  return Math.round((current / total) * 100)
}

/**
 * Get user initials for avatar
 */
export function getUserInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}
