export interface User {
  id: string    
  email: string
  isActive: boolean
  lastLogin: string
  name: string
  phone : string
  role: 'admin' | 'tax_pro' | 'client'
  createdAt : string
  updatedAt : string
}