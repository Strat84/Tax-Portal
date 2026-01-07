export type UserStatus = 'online' | 'away' | 'offline'

export interface User {
  id: string
  email: string
  isActive: boolean
  lastLogin: string
  lastActiveAt?: string
  name: string
  phone : string
  role: 'ADMIN' | 'TAX_PRO' | 'CLIENT'
  status?: UserStatus
  createdAt : string
  updatedAt : string
}

// GraphQL Response Types
export interface GetUserResponse {
  getUser: User
}

export interface UpdateUserResponse {
  updateUser: User
}