import { createClient } from '@supabase/supabase-js'
import type { PostConfirmationTriggerEvent, PostConfirmationTriggerHandler } from 'aws-lambda'

/**
 * AWS Lambda function for Cognito Post-Confirmation trigger
 * This function automatically creates a user record in PostgreSQL after successful Cognito signup
 */

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export const handler: PostConfirmationTriggerHandler = async (
  event: PostConfirmationTriggerEvent
) => {
  console.log('Post-Confirmation Trigger Event:', JSON.stringify(event, null, 2))

  try {
    const {
      request: { userAttributes },
      userName,
    } = event

    // Extract user data from Cognito attributes
    const email = userAttributes.email
    const name = userAttributes.name || ''
    const phone = userAttributes.phone_number || null
    const role = userAttributes['custom:role'] || 'client'
    const taxProId = userAttributes['custom:tax_pro_id'] || null

    console.log('Creating user in PostgreSQL:', {
      cognitoUserId: userName,
      email,
      role,
    })

    // Insert user into PostgreSQL
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        cognito_user_id: userName,
        email,
        name,
        phone,
        role,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (userError) {
      console.error('Error creating user:', userError)
      throw userError
    }

    console.log('User created successfully:', user)

    // If user is a client and has a tax pro assignment, create the relationship
    if (role === 'client' && taxProId) {
      console.log('Creating tax pro assignment:', { clientId: user.id, taxProId })

      // First, get the tax professional's user ID
      const { data: taxProUser, error: taxProError } = await supabase
        .from('users')
        .select('id')
        .eq('cognito_user_id', taxProId)
        .single()

      if (taxProError) {
        console.error('Error finding tax professional:', taxProError)
        // Don't throw - we still want the user creation to succeed
      } else {
        // Create client record
        const { error: clientError } = await supabase
          .from('clients')
          .insert({
            user_id: user.id,
            tax_professional_id: taxProUser.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

        if (clientError) {
          console.error('Error creating client record:', clientError)
          // Don't throw - we still want the user creation to succeed
        } else {
          console.log('Client record and tax pro assignment created successfully')
        }
      }
    }

    // If user is a tax professional, create tax_professionals record
    if (role === 'tax_pro') {
      console.log('Creating tax professional record')

      const { error: taxProError } = await supabase
        .from('tax_professionals')
        .insert({
          user_id: user.id,
          license_number: null, // Can be updated later
          specializations: [],
          years_experience: 0,
          is_accepting_clients: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

      if (taxProError) {
        console.error('Error creating tax professional record:', taxProError)
        // Don't throw - we still want the user creation to succeed
      } else {
        console.log('Tax professional record created successfully')
      }
    }

    // Create default folder structure for clients
    if (role === 'client') {
      console.log('Creating default folder structure for client')

      const taxYear = new Date().getFullYear()
      const folders = [
        { name: `${taxYear}-Tax`, path: `/${taxYear}-Tax`, parent_id: null },
      ]

      // Create root folder first
      const { data: rootFolder, error: rootFolderError } = await supabase
        .from('folders')
        .insert({
          user_id: user.id,
          name: folders[0].name,
          path: folders[0].path,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (rootFolderError) {
        console.error('Error creating root folder:', rootFolderError)
      } else {
        console.log('Root folder created:', rootFolder)

        // Create subfolders
        const subfolders = [
          { name: 'W2s', path: `/${taxYear}-Tax/W2s`, parent_id: rootFolder.id },
          { name: '1099s', path: `/${taxYear}-Tax/1099s`, parent_id: rootFolder.id },
          { name: 'Receipts', path: `/${taxYear}-Tax/Receipts`, parent_id: rootFolder.id },
          { name: 'Other', path: `/${taxYear}-Tax/Other`, parent_id: rootFolder.id },
        ]

        const { error: subfoldersError } = await supabase
          .from('folders')
          .insert(
            subfolders.map((folder) => ({
              user_id: user.id,
              name: folder.name,
              path: folder.path,
              parent_id: folder.parent_id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }))
          )

        if (subfoldersError) {
          console.error('Error creating subfolders:', subfoldersError)
        } else {
          console.log('Subfolders created successfully')
        }
      }
    }

    // Log audit entry
    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: 'user_signup',
        resource_type: 'user',
        resource_id: user.id,
        details: {
          email,
          role,
          signup_method: 'cognito',
        },
        ip_address: event.request.userAttributes['custom:ip_address'] || null,
        user_agent: event.request.userAttributes['custom:user_agent'] || null,
        created_at: new Date().toISOString(),
      })

    if (auditError) {
      console.error('Error creating audit log:', auditError)
      // Don't throw - we still want the user creation to succeed
    }

    console.log('Post-confirmation process completed successfully')
    return event
  } catch (error) {
    console.error('Fatal error in post-confirmation trigger:', error)
    throw error
  }
}
