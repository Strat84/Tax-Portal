'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { configureAmplify, signUp } from '@/lib/auth/cognito'
import PublicGuard from '@/components/auth/PublicGuard'
// Configure Amplify on component mount
configureAmplify()

export default function SignupPage() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '+1 ',
    password: '',
    confirmPassword: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target

  // Special handling for phone field
  if (name === 'phone') {
    // Ensure it always starts with +1
    if (!value.startsWith('+1')) {
      // If user deletes +1, add it back
      setFormData(prev => ({
        ...prev,
        phone: '+1 '
      }))
      return
    }

    // Remove all non-digit characters except leading +1
    const withoutPlusOne = value.substring(2) // Remove '+1'
    const digitsOnly = withoutPlusOne.replace(/\D/g, '')

    // Keep only 10 digits after +1
    const limitedDigits = digitsOnly.substring(0, 10)

    // Format as +1 (XXX) XXX-XXXX
    let formattedPhone = '+1 '

    if (limitedDigits.length > 0) {
      formattedPhone += '('
      formattedPhone += limitedDigits.substring(0, 3) // First 3 digits

      if (limitedDigits.length > 3) {
        formattedPhone += ') '
        formattedPhone += limitedDigits.substring(3, 6) // Next 3 digits

        if (limitedDigits.length > 6) {
          formattedPhone += '-'
          formattedPhone += limitedDigits.substring(6, 10) // Last 4 digits
        }
      }
    }

    setFormData(prev => ({
      ...prev,
      phone: formattedPhone
    }))
  } else {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
}
 const validatePhoneNumber = (phone: string): { isValid: boolean; formatted?: string; error?: string } => {
  if (!phone || phone === '+1 ' || phone === '+1') {
    return { isValid: true } // Phone is optional
  }

  // Check if it starts with +1
  if (!phone.startsWith('+1')) {
    return {
      isValid: false,
      error: 'Phone number must start with +1'
    }
  }

  // Get digits after +1 (removing all non-digits)
  const digitsAfterPlusOne = phone.substring(2).replace(/\D/g, '')

  // Check if we have exactly 10 digits after +1
  if (digitsAfterPlusOne.length !== 10) {
    return {
      isValid: false,
      error: 'Please enter exactly 10 digits. Example: +1 (123) 456-7890'
    }
  }

  // Format to E.164 format for Cognito (+1XXXXXXXXXX)
  return {
    isValid: true,
    formatted: `+1${digitsAfterPlusOne}`
  }
}

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    // Validate password requirements
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      setIsLoading(false)
      return
    }

    // Validate and format phone number
    const phoneValidation = validatePhoneNumber(formData.phone)
    if (!phoneValidation.isValid) {
      setError(phoneValidation.error || 'Invalid phone number')
      setIsLoading(false)
      return
    }

    try {
      // Normalize email to lowercase for case-insensitive username
      const normalizedEmail = formData.email.toLowerCase()

      const result = await signUp(
        normalizedEmail,
        formData.password,
        formData.firstName,
        formData.lastName,
        phoneValidation.formatted || undefined,
        'CLIENT' // Default role for public signup
      )

      if (result.success) {
        setSuccess(true)
        // Redirect to verification page after 2 seconds
        setTimeout(() => {
          router.push(`/verify-email?email=${encodeURIComponent(normalizedEmail)}`)
        }, 2000)
      } else {
        setError(result.error || 'Failed to create account')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <PublicGuard>
        <Card className="w-full shadow-xl border-slate-200 dark:border-slate-700">
          <CardHeader>
            <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Account created!</CardTitle>
            <CardDescription className="text-center">
              Check your email for a verification code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-center text-slate-600 dark:text-slate-400">
              Redirecting you to the verification page...
            </p>
          </CardContent>
        </Card>
      </PublicGuard>
    )
  }

  return (
    <PublicGuard>
      <Card className="w-full shadow-xl border-slate-200 dark:border-slate-700">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
          <CardDescription className="text-center">
            Enter your information to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
              
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Must be at least 8 characters with uppercase, lowercase, number, and special character
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
               
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Creating account...</span>
                </div>
              ) : (
                'Create account'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-900 px-2 text-slate-500 dark:text-slate-400">
                Already have an account?
              </span>
            </div>
          </div>
          <Link href="/login" className="w-full">
            <Button variant="outline" className="w-full">
              Sign in
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </PublicGuard>
  )
}
