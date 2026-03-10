/**
 * Client-related GraphQL types
 */

import type { User, TaxReturnStatus } from './users'

/**
 * Client item for list display
 */
export interface ClientItem {
  id: string
  name: string
  lastname: string
  email: string
  phone?: string
  status: TaxReturnStatus
  lastActivity: string
  taxYear: number
  pendingDocs: number
  unreadMessages: number
}

/**
 * Client details for detail page display
 * Derived from User type with formatting applied
 */
export interface ClientDetailsInfo {
  id: string
  name: string
  email: string
  phone: string
  status: TaxReturnStatus
  taxYear: string
  address: string
  ssn: string
  filingStatus: string
  dependents: number
  joinedDate: string
  lastActivity: string
  pendingDocs: number
  unreadMessages: number
  documentsUploaded: number
}

/**
 * Client filters for list page
 */
export interface ClientFilters {
  searchTerm: string
  statusFilter: string
  yearFilter: string
}

/**
 * Client stat for statistics display
 */
export interface ClientStat {
  label: string
  value: string
  icon: string
}

/**
 * Tax pro statistics
 */
export interface TaxProStats {
  totalClients: number
  activeReturns: number
  needAttention: number
  completedReturns: number
}

// Re-export User and TaxReturnStatus for convenience
export type { TaxReturnStatus, User }
