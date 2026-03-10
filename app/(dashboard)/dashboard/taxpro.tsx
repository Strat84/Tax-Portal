'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useMemo } from 'react'
import { useListUsers, useTaxProUserStats } from '@/hooks/useUserQuery'

// Dashboard components
import { PageHeader, StatCardGrid } from '@/components/dashboard/common'
import { StatusBadge } from '@/components/dashboard/common/Cards'

/**
 * Card Section Component
 */
interface CardSectionProps {
  title: string
  description: string
  children: React.ReactNode
}

function CardSection({ title, description, children }: CardSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

// Types and utilities
import { StatCardData } from '@/lib/dashboard/types'
import { formatRelativeTime, getDeadlineDate } from '@/lib/dashboard/utils'
import {
  TAX_RETURN_STATUS_COLORS,
  TAX_RETURN_STATUS_LABELS,
} from '@/lib/dashboard/constants'

/**
 * Tax Professional Dashboard Component
 * Displays client overview, statistics, and management options
 */
export default function TaxProDashboard() {
  const { users, loading, error } = useListUsers()
  const { stats: taxProStats, loading: statsLoading } = useTaxProUserStats()

  // ============ Filter and Sort Clients ============
  const clients = useMemo(() => {
    if (!users) return []
    return users
      .filter((user) => user.role === 'CLIENT')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10)
  }, [users])

  // ============ Stats Cards ============
  const statsCards: StatCardData[] = useMemo(
    () => [
      {
        label: 'Total Clients',
        value: (taxProStats?.totalClients || 0).toString(),
        icon: '👥',
      },
      {
        label: 'Active Returns',
        value: (taxProStats?.activeReturns || 0).toString(),
        icon: '📋',
      },
      {
        label: 'Pending Requests',
        value: (taxProStats?.pendingRequest || 0).toString(),
        icon: '⏳',
      },
      {
        label: 'Unread Messages',
        value: (taxProStats?.unreadMessages || 0).toString(),
        icon: '💬',
      },
    ],
    [taxProStats]
  )

  // ============ Format Last Activity ============
  const getLastActivity = (updatedAt: string): string => {
    const now = new Date()
    const updated = new Date(updatedAt)
    const diffMs = now.getTime() - updated.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays === 1) return '1 day ago'
    return `${diffDays} days ago`
  }

  // ============ Quick Actions ============
  const deadlineDate = getDeadlineDate(3, 15)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Dashboard"
        description="Overview of your clients and active returns"
      />

      {/* Stats Cards */}
      <StatCardGrid stats={statsCards} />

      {/* Recent Clients Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Clients</CardTitle>
              <CardDescription>Clients you've worked with recently</CardDescription>
            </div>
            <Link href="/clients">
              <Button>View All Clients</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading clients...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-red-600 dark:text-red-400">Error loading clients</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">No clients found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Pending Docs</TableHead>
                  <TableHead className="text-center">Messages</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>
                      {client.taxReturnStatus ? (
                        <StatusBadge
                          status={client.taxReturnStatus}
                          colorClass={TAX_RETURN_STATUS_COLORS[client.taxReturnStatus]}
                          label={TAX_RETURN_STATUS_LABELS[client.taxReturnStatus]}
                        />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {client.pendingRequest && client.pendingRequest > 0 ? (
                        <Badge variant="destructive">{client.pendingRequest}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {client.unreadMessages && client.unreadMessages > 0 ? (
                        <Badge variant="default">{client.unreadMessages}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {getLastActivity(client.updatedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/clients/${client.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Deadlines and Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Deadlines */}
        <CardSection title="Upcoming Deadlines" description="Important dates and milestones">
          <div className="space-y-4">
            <DeadlineItem
              date="15"
              title="Tax Filing Deadline"
              subtitle="April 15, 2025"
              daysRemaining={45}
              variant="danger"
            />
            <DeadlineItem
              date="20"
              title="Q1 Estimated Taxes"
              subtitle="March 20, 2025"
              daysRemaining={19}
              variant="warning"
            />
          </div>
        </CardSection>

        {/* Quick Actions */}
        <CardSection title="Quick Actions" description="Common tasks and shortcuts">
          <div className="space-y-2">
            <Button className="w-full justify-start" variant="outline">
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Request Documents from Client
            </Button>

            <Button className="w-full justify-start" variant="outline">
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              Send Bulk Message
            </Button>

            <Button className="w-full justify-start" variant="outline">
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Update Client Status
            </Button>

            <Link href="/clients">
              <Button className="w-full justify-start" variant="outline">
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Search Clients
              </Button>
            </Link>
          </div>
        </CardSection>
      </div>
    </div>
  )
}

/**
 * Deadline Item Component
 */
interface DeadlineItemProps {
  date: string
  title: string
  subtitle: string
  daysRemaining: number
  variant: 'danger' | 'warning' | 'success'
}

function DeadlineItem({ date, title, subtitle, daysRemaining, variant }: DeadlineItemProps) {
  const bgColor = {
    danger: 'bg-red-100 dark:bg-red-900/20',
    warning: 'bg-orange-100 dark:bg-orange-900/20',
    success: 'bg-green-100 dark:bg-green-900/20',
  }[variant]

  const textColor = {
    danger: 'text-red-600 dark:text-red-400',
    warning: 'text-orange-600 dark:text-orange-400',
    success: 'text-green-600 dark:text-green-400',
  }[variant]

  return (
    <div className="flex items-start gap-4 p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${bgColor}`}>
        <span className={`${textColor} font-semibold`}>{date}</span>
      </div>
      <div className="flex-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
        <p className={`text-xs ${textColor} mt-1`}>{daysRemaining} days remaining</p>
      </div>
    </div>
  )
}
