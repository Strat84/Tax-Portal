'use client'

import { SettingsForm } from '@/components/settings/SettingsForm'
import { useDashboardUser } from '@/contexts/DashboardUserContext'
import { useUpdateUserProfile } from '@/hooks/useUserQuery'

export default function ClientSettingsPage() {
  const { user, loading, error } = useDashboardUser()

  const { updateProfile } = useUpdateUserProfile()

  const handleProfileUpdate = async (formData: {
    name: string
    email: string
    phone: string
  }) => {
    // Call Apollo mutation to update user profile and update cache
    return await updateProfile({ name: formData.name, phone: formData.phone })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">
            Error loading user data. Please try again.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <SettingsForm
          initialName={user?.name || ''}
          initialEmail={user?.email || ''}
          initialPhone={user?.phone || ''}
          onUpdate={handleProfileUpdate}
        />
      </div>
    </div>
  )
}
