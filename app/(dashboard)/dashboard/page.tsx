'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import AdminDashboard from './admin'
import TaxProDashboard from './taxpro'
import ClientDashboard from './client'

export default function Dashboard() {
  const { user, loading } = useAuth()

  // Show loading state while user is being fetched
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <svg
                className="animate-spin h-5 w-5 text-primary"
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
              <span>Loading dashboard...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error if user is not loaded
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Unable to load user information</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render appropriate dashboard based on user role
  switch (user.role) {
    case 'ADMIN':
      return <AdminDashboard />
    case 'TAX_PRO':
      return <TaxProDashboard />
    case 'CLIENT':
      return <ClientDashboard />
    default:
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Card>
            <CardContent className="p-6">
              <p className="text-destructive">Invalid user role</p>
            </CardContent>
          </Card>
        </div>
      )
  }
}
