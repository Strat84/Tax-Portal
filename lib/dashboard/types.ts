/**
 * Dashboard Type Definitions
 * Centralized types for dashboard components and utilities
 */

import { TaxReturnStatus } from '@/graphql/types/users'

/**
 * Stat Card Configuration
 */
export interface StatCardData {
  label: string
  value: string
  icon: string
  description?: string
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive'
}

/**
 * Message Display
 */
export interface DashboardMessage {
  id: string
  from: string
  subject: string
  preview: string
  date: string
  unread: boolean
}

/**
 * Activity Item
 */
export interface ActivityItem {
  id: string
  type: 'user_signup' | 'document_upload' | 'status_update' | 'user_login' | 'message'
  user: string
  action: string
  time: string
  icon?: string
}

/**
 * Status Step in Progress Tracker
 */
export interface StatusStep {
  key: TaxReturnStatus
  label: string
}

/**
 * Document Request Summary
 */
export interface DocumentRequestSummary {
  documentRequestId: string
  documentType: string
  dueDate: string
  status: string
  priority: string
  description?: string
}

/**
 * Dashboard State
 */
export interface DashboardLoadingState {
  isLoading: boolean
  error?: string | null
}

/**
 * Load State Props
 */
export interface LoadStateProps {
  isLoading: boolean
  error?: string | null
  isEmpty: boolean
  loadingText?: string
  errorText?: string
  emptyText?: string
}

/**
 * Deadline Information
 */
export interface DeadlineInfo {
  label: string
  date: Date
  daysRemaining: number
  variant?: 'danger' | 'warning' | 'success'
}
