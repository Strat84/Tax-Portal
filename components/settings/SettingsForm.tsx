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
  const [formData, setFormData] = useState({
    name: initialName,
    email: initialEmail,
    phone: initialPhone,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
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
      if (!formData.phone.trim()) {
        throw new Error('Phone is required')
      }

      // Call the onUpdate callback if provided
      if (onUpdate) {
        await onUpdate(formData)
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
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="Enter your phone number"
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
