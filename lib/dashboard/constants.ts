/**
 * Dashboard Constants
 * Centralized configuration for status colors, labels, and mappings
 */

/**
 * Tax Return Status Colors and Styling
 */
export const TAX_RETURN_STATUS_COLORS: Record<string, string> = {
  DOCUMENTS_PENDING:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  DOCUMENTS_RECEIVED:
    'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  IN_PROGRESS:
    'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  READY_FOR_REVIEW:
    'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  FILED: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  COMPLETE:
    'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
}

/**
 * Tax Return Status Labels
 */
export const TAX_RETURN_STATUS_LABELS: Record<string, string> = {
  DOCUMENTS_PENDING: 'Docs Pending',
  DOCUMENTS_RECEIVED: 'Docs Received',
  IN_PROGRESS: 'In Progress',
  READY_FOR_REVIEW: 'Ready for Review',
  FILED: 'Filed',
  COMPLETE: 'Complete',
}

/**
 * Tax Return Status Full Descriptions
 */
export const TAX_RETURN_STATUS_DESCRIPTIONS: Record<string, string> = {
  DOCUMENTS_PENDING: 'Waiting for your documents to be uploaded.',
  DOCUMENTS_RECEIVED:
    'Documents received. Your tax professional will begin processing soon.',
  IN_PROGRESS: 'Your tax return is currently being prepared.',
  READY_FOR_REVIEW: 'Your tax return is ready for review.',
  FILED: 'Your tax return has been filed with the IRS.',
  COMPLETE: 'Your tax return process is complete!',
}

/**
 * Tax Deadline Dates
 */
export const TAX_DEADLINES = {
  IRS_DEADLINE: { month: 3, day: 15, name: 'IRS Federal Filing Deadline' },
  INTERNAL_DEADLINE: { month: 2, day: 1, name: 'Internal Processing Deadline' },
} as const

/**
 * Activity Type Icons
 */
export const ACTIVITY_TYPE_ICONS: Record<string, string> = {
  user_signup: '👤',
  document_upload: '📄',
  status_update: '✅',
  user_login: '🔐',
  message: '💬',
}

/**
 * Activity Type Labels
 */
export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  user_signup: 'User Signup',
  document_upload: 'Document Upload',
  status_update: 'Status Update',
  user_login: 'User Login',
  message: 'Message',
}

/**
 * Priority Colors
 */
export const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20',
  NORMAL: 'bg-slate-100 text-slate-800 dark:bg-slate-900/20',
  HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20',
  URGENT: 'bg-red-100 text-red-800 dark:bg-red-900/20',
}

/**
 * Request Status Colors
 */
export const REQUEST_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20',
  UPLOADED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20',
  APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/20',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/20',
  CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20',
}

/**
 * System Health Status Colors
 */
export const HEALTH_STATUS_COLORS: Record<string, string> = {
  healthy: 'bg-green-100 text-green-800 dark:bg-green-900/20',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/20',
}

/**
 * System Health Indicators Colors (dots)
 */
export const HEALTH_DOT_COLORS: Record<string, string> = {
  healthy: 'bg-green-500',
  warning: 'bg-yellow-500',
  critical: 'bg-red-500',
}
