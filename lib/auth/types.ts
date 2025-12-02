export interface AuthUser {
  cognitoUserId: string
  email: string
  name?: string
  role: 'admin' | 'tax_pro' | 'client'
  assignedTaxProId?: string
}

export interface SessionUser extends AuthUser {
  userId: string // Database user ID
}
