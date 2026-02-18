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
    lastname: string
    phone: string
    address?: string
    ssn?: string
    taxYear?: string
    filingStatus?: string
    numberOfDependents?: number
  }) => {
    // Call Apollo mutation to update user profile and update cache
    return await updateProfile({
      name: formData.name,
      lastname: formData.lastname,
      phone: formData.phone,
      address: formData.address,
      ssn: formData.ssn,
      taxYear: formData.taxYear,
      filingStatus: formData.filingStatus,
      numberOfDependents: formData.numberOfDependents,
    })
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
      <div className="w-full max-w-2xl">
        <SettingsForm
          initialName={user?.name || ''}
          initialLastname={user?.lastname || ''}
          initialEmail={user?.email || ''}
          initialPhone={user?.phone || ''}
          initialAddress={user?.address || ''}
          initialSsn={user?.ssn || ''}
          initialTaxYear={user?.taxYear || ''}
          initialFilingStatus={user?.filingStatus || ''}
          initialNumberOfDependents={user?.numberOfDependents || 0}
          onUpdate={handleProfileUpdate}
        />
      </div>
    </div>
  )
}
