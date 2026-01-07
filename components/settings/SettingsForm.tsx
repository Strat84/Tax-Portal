'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface SettingsFormProps {
  initialName?: string
  initialEmail?: string
  initialPhone?: string
  onUpdate?: (formData: {
    name: string
    email: string
    phone: string
  }) => Promise<any>
}

export function SettingsForm({
  initialName = '',
  initialEmail = '',
  initialPhone = '',
  onUpdate,
}: SettingsFormProps) {
  // Format initial phone to display format if it exists
  const formatPhoneForDisplay = (phone: string): string => {
    if (!phone || phone === '+1' || phone === '+1 ') return '+1 '

    // Extract digits only (remove +1 prefix)
    const digitsOnly = phone.replace(/\D/g, '')
    const withoutCountryCode = digitsOnly.startsWith('1') ? digitsOnly.substring(1) : digitsOnly

    // Format as +1 (XXX) XXX-XXXX
    if (withoutCountryCode.length === 0) return '+1 '

    let formatted = '+1 ('
    formatted += withoutCountryCode.substring(0, 3)

    if (withoutCountryCode.length > 3) {
      formatted += ') '
      formatted += withoutCountryCode.substring(3, 6)

      if (withoutCountryCode.length > 6) {
        formatted += '-'
        formatted += withoutCountryCode.substring(6, 10)
      }
    }

    return formatted
  }

  const [formData, setFormData] = useState({
    name: initialName,
    email: initialEmail,
    phone: formatPhoneForDisplay(initialPhone),
  })
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

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
      setFormData((prev) => ({
        ...prev,
        [name]: value,
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

    // Format to E.164 format for backend (+1XXXXXXXXXX)
    return {
      isValid: true,
      formatted: `+1${digitsAfterPlusOne}`
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setStatus('idle')

    try {
      // Basic validation
      if (!formData.name.trim()) {
        throw new Error('Name is required')
      }

      // Validate phone number
      const phoneValidation = validatePhoneNumber(formData.phone)
      if (!phoneValidation.isValid) {
        throw new Error(phoneValidation.error || 'Invalid phone number')
      }

      // Call the onUpdate callback if provided
      if (onUpdate) {
        // Use formatted phone number (E.164 format) for backend
        await onUpdate({
          ...formData,
          phone: phoneValidation.formatted || formData.phone
        })
      } else {
        // Fallback: simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      setStatus('success')
      setMessage('Profile updated successfully!')
      setTimeout(() => setStatus('idle'), 3000)
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Failed to update profile')
      setTimeout(() => setStatus('idle'), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md p-6">
      <h2 className="text-2xl font-bold mb-6">Update Profile</h2>

      {status !== 'idle' && (
        <div
          className={`mb-4 flex items-center gap-2 rounded-lg p-3 ${
            status === 'success'
              ? 'bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-200'
          }`}
        >
          {status === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span className="text-sm font-medium">{message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Enter your name"
            value={formData.name}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>

        {/* Email Field (Disabled) */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="your@email.com"
            value={formData.email}
            disabled
            className="bg-slate-100 dark:bg-slate-800 cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground">Email cannot be changed</p>
        </div>

        {/* Phone Field */}
        <div className="space-y-2">
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+1 (787) 878-7878"
            value={formData.phone}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full mt-6" disabled={isLoading}>
          {isLoading ? 'Updating...' : 'Update Profile'}
        </Button>
      </form>
    </Card>
  )
}
