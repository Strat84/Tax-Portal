export interface AuthUser {
  cognitoUserId: string
  email: string
  name?: string
  role: 'ADMIN' | 'TAX_PRO' | 'CLIENT'
  assignedTaxProId?: string
}

export interface SessionUser extends AuthUser {
  userId: string // Database user ID
}
