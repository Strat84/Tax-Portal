export type UserStatus = 'online' | 'away' | 'offline'

export type TaxReturnStatus =
  | 'DOCUMENTS_PENDING'
  | 'DOCUMENTS_RECEIVED'
  | 'IN_PROGRESS'
  | 'READY_FOR_REVIEW'
  | 'FILED'
  | 'COMPLETE'

export interface User {
  id: string
  email: string
  isActive: boolean
  lastLogin: string
  lastActiveAt?: string
  name: string
  phone: string
  role: 'ADMIN' | 'TAX_PRO' | 'CLIENT'
  status?: UserStatus
  createdAt: string
  updatedAt: string
  address?: string
  ssn?: string
  taxYear?: string
  filingStatus?: string
  numberOfDependents?: number
  taxReturnStatus?: TaxReturnStatus
  pendingRequest?: number
  unreadMessages?: number
  documentsUploaded?: number
}

// GraphQL Response Types
export interface GetUserResponse {
  getUser: User
}

export interface UpdateUserResponse {
  updateUser: User
}