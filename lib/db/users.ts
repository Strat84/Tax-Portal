import { SupabaseClient } from '@supabase/supabase-js'

export interface User {
  id: string
  cognito_user_id: string
  email: string
  role: 'admin' | 'tax_pro' | 'client'
  name: string | null
  phone: string | null
  created_at: string
  updated_at: string
  last_login: string | null
  is_active: boolean
}

export interface TaxProfessional {
  id: string
  user_id: string
  license_number: string | null
  specializations: string[] | null
  max_clients: number
  created_at: string
}

export interface Client {
  id: string
  user_id: string
  assigned_tax_pro_id: string | null
  tax_year: number
  address: any | null
  profile_data: any | null
  onboarding_completed: boolean
  created_at: string
}

/**
 * Get user by Cognito user ID
 */
export async function getUserByCognitoId(
  supabase: SupabaseClient,
  cognitoUserId: string
): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('cognito_user_id', cognitoUserId)
    .single()

  if (error) {
    console.error('Error fetching user:', error)
    return null
  }

  return data
}

/**
 * Get user by email
 */
export async function getUserByEmail(
  supabase: SupabaseClient,
  email: string
): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error) {
    console.error('Error fetching user by email:', error)
    return null
  }

  return data
}

/**
 * Create a new user (called by Lambda trigger after Cognito signup)
 */
export async function createUser(
  supabase: SupabaseClient,
  userData: {
    cognito_user_id: string
    email: string
    role: 'admin' | 'tax_pro' | 'client'
    name?: string
    phone?: string
  }
): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .insert([userData])
    .select()
    .single()

  if (error) {
    console.error('Error creating user:', error)
    return null
  }

  return data
}

/**
 * Update user's last login timestamp
 */
export async function updateLastLogin(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  await supabase
    .from('users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', userId)
}

/**
 * Get tax professional by user ID
 */
export async function getTaxProfessionalByUserId(
  supabase: SupabaseClient,
  userId: string
): Promise<TaxProfessional | null> {
  const { data, error } = await supabase
    .from('tax_professionals')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching tax professional:', error)
    return null
  }

  return data
}

/**
 * Get client by user ID
 */
export async function getClientByUserId(
  supabase: SupabaseClient,
  userId: string
): Promise<Client | null> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching client:', error)
    return null
  }

  return data
}

/**
 * Get all clients assigned to a tax professional
 */
export async function getClientsByTaxProId(
  supabase: SupabaseClient,
  taxProId: string
): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*, users:user_id(*)')
    .eq('assigned_tax_pro_id', taxProId)

  if (error) {
    console.error('Error fetching clients:', error)
    return []
  }

  return data || []
}
