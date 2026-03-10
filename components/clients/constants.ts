/**
 * Constants for clients module
 */

export const STATUS_COLORS: Record<string, string> = {
  DOCUMENTS_PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  DOCUMENTS_RECEIVED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  IN_PROGRESS: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  READY_FOR_REVIEW: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  FILED: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  COMPLETE: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
}

export const STATUS_LABELS: Record<string, string> = {
  DOCUMENTS_PENDING: 'Docs Pending',
  DOCUMENTS_RECEIVED: 'Docs Received',
  IN_PROGRESS: 'In Progress',
  READY_FOR_REVIEW: 'Ready for Review',
  FILED: 'Filed',
  COMPLETE: 'Complete',
}

export const DOCUMENT_TYPES = [
  { value: 'W2', label: 'W-2' },
  { value: 'W4', label: 'W-4' },
  { value: 'SCHEDULE_C', label: 'Schedule C' },
  { value: 'SCHEDULE_E', label: 'Schedule E' },
  { value: 'PROPERTY_TAX_STATEMENT', label: 'Property Tax Statement' },
  { value: 'MORTGAGE_INTEREST_1098', label: 'Mortgage Interest (1098)' },
  { value: 'STUDENT_LOAN_INTEREST', label: 'Student Loan Interest' },
  { value: 'MEDICAL_EXPENSE_RECEIPTS', label: 'Medical Expense Receipts' },
  { value: 'CHARITABLE_DONATION_RECEIPTS', label: 'Charitable Donation Receipts' },
  { value: 'BUSINESS_EXPENSE_RECEIPTS', label: 'Business Expense Receipts' },
  { value: 'DRIVERS_LICENSE_ID', label: 'Driver\'s License / ID' },
  { value: 'SOCIAL_SECURITY_CARD', label: 'Social Security Card' },
  { value: 'PRIOR_YEAR_RETURN', label: 'Prior Year Return' },
  { value: 'OTHER', label: 'Other' },
]

export const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'HIGH', label: 'High' },
]

export const TAX_YEARS = ['2025', '2024', '2023']
