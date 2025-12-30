import { Amplify } from 'aws-amplify'
import {
  signIn as amplifySignIn,
  signUp as amplifySignUp,
  signOut as amplifySignOut,
  confirmSignUp,
  resendSignUpCode,
  resetPassword,
  confirmResetPassword,
  getCurrentUser,
  fetchAuthSession,
  FetchAuthSessionOptions,
  SignInInput,
  SignUpInput,
} from 'aws-amplify/auth'
import awsConfig from "../../src/amplifyconfiguration.json"

// Configure Amplify with Cognito settings
export function configureAmplify() {
  Amplify.configure(awsConfig)
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  try {
    // Check if there's already a signed in user and sign them out first
    try {
      const user = await getCurrentUser()
      if (user) {
        console.log('Existing user found, signing out first...')
        await amplifySignOut({ global: true })
      }
    } catch (err) {
      // No user signed in, continue
    }

    const result = await amplifySignIn({
      username: email,
      password,
    })
    return { success: true, result }
  } catch (error: any) {
    console.error('Sign in error:', error)
    return {
      success: false,
      error: error.message || 'Failed to sign in',
    }
  }
}

/**
 * Sign up a new user
 */
export async function signUp(
  email: string,
  password: string,
  name: string,
  phone?: string,
  role: 'ADMIN' | 'TAX_PRO' | 'CLIENT' = 'CLIENT'
) {
  try {
    const result = await amplifySignUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
          name,
          ...(phone && { phone_number: phone }),
          'custom:role': role,
        },
        autoSignIn: true,
      },
    })
    return { success: true, result }
  } catch (error: any) {
    console.error('Sign up error:', error)
    return {
      success: false,
      error: error.message || 'Failed to sign up',
    }
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  try {
    // Sign out globally to clear all sessions
    await amplifySignOut({ global: true })
    // Clear the idToken cookie
    document.cookie = 'idToken=; path=/; max-age=0'
    // Clear all auth-related cookies
    document.cookie = 'amplifyAuthenticatedUser=; path=/; max-age=0'
    return { success: true }
  } catch (error: any) {
    console.error('Sign out error:', error)
    // Still clear cookies even if signOut fails
    document.cookie = 'idToken=; path=/; max-age=0'
    document.cookie = 'amplifyAuthenticatedUser=; path=/; max-age=0'
    return {
      success: false,
      error: error.message || 'Failed to sign out',
    }
  }
}

/**
 * Confirm sign up with verification code
 */
export async function confirmSignUpCode(email: string, code: string) {
  try {
    await confirmSignUp({
      username: email,
      confirmationCode: code,
    })
    return { success: true }
  } catch (error: any) {
    console.error('Confirmation error:', error)
    return {
      success: false,
      error: error.message || 'Failed to confirm sign up',
    }
  }
}

/**
 * Resend verification code
 */
export async function resendVerificationCode(email: string) {
  try {
    await resendSignUpCode({
      username: email,
    })
    return { success: true }
  } catch (error: any) {
    console.error('Resend code error:', error)
    return {
      success: false,
      error: error.message || 'Failed to resend code',
    }
  }
}

/**
 * Initiate password reset
 */
export async function initiatePasswordReset(email: string) {
  try {
    await resetPassword({
      username: email,
    })
    return { success: true }
  } catch (error: any) {
    console.error('Password reset error:', error)
    return {
      success: false,
      error: error.message || 'Failed to initiate password reset',
    }
  }
}

/**
 * Confirm password reset with code
 */
export async function confirmPasswordReset(
  email: string,
  code: string,
  newPassword: string
) {
  try {
    await confirmResetPassword({
      username: email,
      confirmationCode: code,
      newPassword,
    })
    return { success: true }
  } catch (error: any) {
    console.error('Confirm password reset error:', error)
    return {
      success: false,
      error: error.message || 'Failed to reset password',
    }
  }
}

/**
 * Get the current authenticated user
 */
export async function getAuthenticatedUser() {
  try {
    const user = await getCurrentUser()
    return { success: true, user }
  } catch (error) {
    return { success: false, user: null }
  }
}

/**
 * Get the current user's JWT tokens
 */
export async function getAuthSession(options?: FetchAuthSessionOptions) {
  try {
    const session = await fetchAuthSession(options)
    return { success: true, session }
  } catch (error: any) {
    console.error('Get session error:', error)
    return {
      success: false,
      error: error.message || 'Failed to get session',
    }
  }
}

/**
 * Extract user info from JWT token
 */
export function extractUserFromToken(idToken: any) {
  if (!idToken || !idToken.payload) {
    return null
  }

  const payload = idToken.payload
  return {
    cognitoUserId: payload.sub,
    email: payload.email,
    name: payload.name,
    role: payload['custom:role'],
    assignedTaxProId: payload['custom:assigned_tax_pro_id'],
  }
}
