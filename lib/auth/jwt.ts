import { jwtVerify, createRemoteJWKSet } from 'jose'
import { AuthUser } from './types'

// Cognito JWKs endpoint
const COGNITO_JWKS_URL = `https://cognito-idp.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID}/.well-known/jwks.json`

// Create JWKS client
const JWKS = createRemoteJWKSet(new URL(COGNITO_JWKS_URL))

/**
 * Verify and decode a Cognito JWT token
 */
export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://cognito-idp.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID}`,
      audience: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
    })

    // Extract user information from token
    return {
      cognitoUserId: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload['custom:role'] as 'admin' | 'tax_pro' | 'client',
      assignedTaxProId: payload['custom:assigned_tax_pro_id'] as string | undefined,
    }
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) {
    return null
  }

  // Check for Bearer token
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null
  }

  return parts[1]
}

/**
 * Get user from request headers
 */
export async function getUserFromRequest(
  headers: Headers
): Promise<AuthUser | null> {
  const authHeader = headers.get('authorization')
  const token = extractTokenFromHeader(authHeader)

  if (!token) {
    return null
  }

  return await verifyToken(token)
}
