'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Dashboard components
import { PageHeader, StatCardGrid, CardSection, HealthStatus } from '@/components/dashboard/common'
import { ActivityItem } from '@/components/dashboard/common/Cards'

// Types and utilities
import { StatCardData, ActivityItem as ActivityItemType } from '@/lib/dashboard/types'
import { ACTIVITY_TYPE_ICONS } from '@/lib/dashboard/constants'

/**
 * Admin Dashboard Component
 * System-wide overview and management
 */
export default function AdminDashboard() {
  // ============ System Stats ============
  const systemStats: StatCardData[] = [
    {
      label: 'Total Users',
      value: '156',
      icon: '👥',
      change: '+12 this month',
      trend: 'up',
    },
    {
      label: 'Tax Professionals',
      value: '8',
      icon: '💼',
      change: '+1 this month',
      trend: 'up',
    },
    {
      label: 'Active Clients',
      value: '148',
      icon: '👨‍💼',
      change: '+11 this month',
      trend: 'up',
    },
    {
      label: 'Total Documents',
      value: '2,847',
      icon: '📄',
      change: '+234 this week',
      trend: 'up',
    },
  ]

  // ============ Recent Activity ============
  const recentActivity: ActivityItemType[] = [
    {
      id: '1',
      type: 'user_signup',
      user: 'John Doe',
      action: 'signed up as a client',
      time: '5 minutes ago',
      icon: ACTIVITY_TYPE_ICONS.user_signup,
    },
    {
      id: '2',
      type: 'document_upload',
      user: 'Jane Smith',
      action: 'uploaded 3 documents',
      time: '1 hour ago',
      icon: ACTIVITY_TYPE_ICONS.document_upload,
    },
    {
      id: '3',
      type: 'status_update',
      user: 'Tax Pro Sarah',
      action: 'updated client status to Filed',
      time: '2 hours ago',
      icon: ACTIVITY_TYPE_ICONS.status_update,
    },
    {
      id: '4',
      type: 'user_login',
      user: 'Mike Johnson',
      action: 'logged in',
      time: '3 hours ago',
      icon: ACTIVITY_TYPE_ICONS.user_login,
    },
  ]

  // ============ Tax Professionals ============
  const taxProfessionals = [
    {
      id: '1',
      name: 'Sarah Johnson',
      clients: 24,
      activeReturns: 12,
      completedReturns: 145,
      status: 'active',
    },
    {
      id: '2',
      name: 'Michael Chen',
      clients: 18,
      activeReturns: 8,
      completedReturns: 98,
      status: 'active',
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      clients: 31,
      activeReturns: 15,
      completedReturns: 212,
      status: 'active',
    },
  ]

  // ============ System Health ============
  const systemHealth = [
    {
      label: 'API Status',
      description: 'All systems operational',
      status: 'healthy' as const,
    },
    {
      label: 'Database',
      description: '99.9% uptime',
      status: 'healthy' as const,
    },
    {
      label: 'Storage',
      description: '2.3 TB / 5 TB used',
      status: 'healthy' as const,
    },
    {
      label: 'Email Service',
      description: 'Rate limit approaching',
      status: 'warning' as const,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Admin Dashboard"
        description="System-wide overview and management"
      />

      {/* Stats Cards */}
      <StatCardGrid stats={systemStats} />

      {/* Recent Activity and System Health */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activity */}
        <CardSection title="Recent Activity" description="Latest system-wide activities">
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <ActivityItem
                key={activity.id}
                icon={activity.icon || ''}
                user={activity.user}
                action={activity.action}
                time={activity.time}
              />
            ))}
          </div>
        </CardSection>

        {/* System Health */}
        <CardSection title="System Health" description="Platform status and metrics">
          <div className="space-y-4">
            {systemHealth.map((health) => (
              <HealthStatus
                key={health.label}
                label={health.label}
                description={health.description}
                status={health.status}
              />
            ))}
          </div>
        </CardSection>
      </div>

      {/* Tax Professionals Table */}
      <CardSection
        title="Tax Professionals"
        description="Overview of all tax professionals on the platform"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-center">Clients</TableHead>
              <TableHead className="text-center">Active Returns</TableHead>
              <TableHead className="text-center">Completed</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {taxProfessionals.map((taxPro) => (
              <TableRow key={taxPro.id}>
                <TableCell className="font-medium">{taxPro.name}</TableCell>
                <TableCell className="text-center">{taxPro.clients}</TableCell>
                <TableCell className="text-center">{taxPro.activeReturns}</TableCell>
                <TableCell className="text-center">{taxPro.completedReturns}</TableCell>
                <TableCell>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20">
                    {taxPro.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-4">
          <Link href="/admin/tax-professionals">
            <Button>Manage Tax Professionals</Button>
          </Link>
        </div>
      </CardSection>

      {/* Quick Actions */}
      <CardSection title="Quick Actions" description="Administrative tasks and management">
        <div className="grid gap-4 md:grid-cols-4">
          <QuickActionButton
            icon="👤"
            label="Add Tax Pro"
            description="Create new tax professional"
          />
          <QuickActionButton
            icon="📊"
            label="View Reports"
            description="System analytics and reports"
          />
          <Link href="/admin/logs">
            <QuickActionButton
              icon="📄"
              label="Audit Logs"
              description="View system activity logs"
            />
          </Link>
          <QuickActionButton
            icon="⚙️"
            label="Settings"
            description="Configure system settings"
          />
        </div>
      </CardSection>
    </div>
  )
}

/**
 * Quick Action Button Component
 */
interface QuickActionButtonProps {
  icon: string
  label: string
  description: string
  href?: string
  onClick?: () => void
}

function QuickActionButton({ 
  icon, 
  label, 
  description, 
  href, 
  onClick 
}: QuickActionButtonProps) {
  const content = (
    <Button 
      variant="outline" 
      className="h-auto flex-col items-start p-4 w-full"
      onClick={onClick}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <span className="font-semibold">{label}</span>
      <span className="text-xs text-muted-foreground">{description}</span>
    </Button>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
