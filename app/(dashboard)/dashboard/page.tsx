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
import { formatRelativeTime } from '@/lib/utils'

export default function Dashboard() {
  const { users, loading } = useListUsers(4)

  // TODO: Fetch actual data from API
  const stats = [
    { label: 'Total Clients', value: '24', change: '+2 this month', icon: '👥' },
    { label: 'Active Returns', value: '12', change: '8 in progress', icon: '📋' },
    { label: 'Pending Requests', value: '7', change: '3 overdue', icon: '⏳' },
    { label: 'Unread Messages', value: '5', change: 'From 4 clients', icon: '💬' },
  ]

  // Map API users to client format with dynamic name and lastActivity
  const recentClients = users?.map((user) => ({
    id: user.id,
    name: user.name,
    status: 'in_progress', // Static for now
    pendingDocs: 2, // Static for now
    unreadMessages: 1, // Static for now
    lastActivity: formatRelativeTime(user.lastActiveAt),
  })) || []

  const statusColors: Record<string, string> = {
    documents_pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    documents_received: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    in_progress: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    ready_for_review: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    filed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    complete: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  }

  const statusLabels: Record<string, string> = {
    documents_pending: 'Docs Pending',
    documents_received: 'Docs Received',
    in_progress: 'In Progress',
    ready_for_review: 'Ready for Review',
    filed: 'Filed',
    complete: 'Complete',
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : recentClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No clients found
                  </TableCell>
                </TableRow>
              ) : (
                recentClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[client.status]} variant="outline">
                        {statusLabels[client.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {client.pendingDocs > 0 ? (
                        <Badge variant="destructive">{client.pendingDocs}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {client.unreadMessages > 0 ? (
                        <Badge variant="default">{client.unreadMessages}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {client.lastActivity}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
