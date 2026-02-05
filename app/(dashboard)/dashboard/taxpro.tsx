'use client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useListUsers } from '@/hooks/useUserQuery'
import { useMemo } from 'react'

export default function TaxProDashboard() {
  const { users, loading, error } = useListUsers()

  // Filter only CLIENT role users and sort by updatedAt
  const clients = useMemo(() => {
    if (!users) return []
    return users
      .filter(user => user.role === 'CLIENT')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10) // Show only 10 most recent clients
  }, [users])

  // Calculate stats from actual data
  const totalClients = clients.length
  const activeReturns = clients.filter(client =>
    client.taxReturnStatus &&
    ['IN_PROGRESS', 'READY_FOR_REVIEW', 'DOCUMENTS_RECEIVED'].includes(client.taxReturnStatus)
  ).length
  const pendingRequests = clients.reduce((sum, client) => sum + (client.pendingRequest || 0), 0)
  const unreadMessages = clients.reduce((sum, client) => sum + (client.unreadMessages || 0), 0)

  const stats = [
    { label: 'Total Clients', value: totalClients.toString(), change: `${totalClients} total`, icon: '👥' },
    { label: 'Active Returns', value: activeReturns.toString(), change: `${activeReturns} in progress`, icon: '📋' },
    { label: 'Pending Requests', value: pendingRequests.toString(), change: `${pendingRequests} total`, icon: '⏳' },
    { label: 'Unread Messages', value: unreadMessages.toString(), change: `From ${clients.filter(c => c.unreadMessages > 0).length} clients`, icon: '💬' },
  ]

  // Helper function to format last activity
  const getLastActivity = (updatedAt: string) => {
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

  const statusColors: Record<string, string> = {
    DOCUMENTS_PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    DOCUMENTS_RECEIVED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    IN_PROGRESS: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    READY_FOR_REVIEW: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    FILED: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    COMPLETE: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  }

  const statusLabels: Record<string, string> = {
    DOCUMENTS_PENDING: 'Docs Pending',
    DOCUMENTS_RECEIVED: 'Docs Received',
    IN_PROGRESS: 'In Progress',
    READY_FOR_REVIEW: 'Ready for Review',
    FILED: 'Filed',
    COMPLETE: 'Complete',
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of your clients and active returns
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <span className="text-2xl">{stat.icon}</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Client List */}
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
                        <Badge className={statusColors[client.taxReturnStatus]} variant="outline">
                          {statusLabels[client.taxReturnStatus]}
                        </Badge>
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

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
            <CardDescription>Important dates and milestones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                  <span className="text-red-600 dark:text-red-400 font-semibold">15</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">Tax Filing Deadline</p>
                  <p className="text-sm text-muted-foreground">April 15, 2025</p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">45 days remaining</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
                  <span className="text-orange-600 dark:text-orange-400 font-semibold">20</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">Q1 Estimated Taxes</p>
                  <p className="text-sm text-muted-foreground">March 20, 2025</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">19 days remaining</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button className="w-full justify-start" variant="outline">
                <svg
                  className="h-5 w-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Request Documents from Client
              </Button>

              <Button className="w-full justify-start" variant="outline">
                <svg
                  className="h-5 w-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
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
                <svg
                  className="h-5 w-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
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
                  <svg
                    className="h-5 w-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
