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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function AdminDashboard() {
  // TODO: Fetch actual data from API
  const systemStats = [
    { label: 'Total Users', value: '156', change: '+12 this month', icon: '👥', trend: 'up' },
    { label: 'Tax Professionals', value: '8', change: '+1 this month', icon: '💼', trend: 'up' },
    { label: 'Active Clients', value: '148', change: '+11 this month', icon: '👨‍💼', trend: 'up' },
    { label: 'Total Documents', value: '2,847', change: '+234 this week', icon: '📄', trend: 'up' },
  ]

  const recentActivity = [
    {
      id: '1',
      type: 'user_signup',
      user: 'John Doe',
      action: 'signed up as a client',
      time: '5 minutes ago',
    },
    {
      id: '2',
      type: 'document_upload',
      user: 'Jane Smith',
      action: 'uploaded 3 documents',
      time: '1 hour ago',
    },
    {
      id: '3',
      type: 'status_update',
      user: 'Tax Pro Sarah',
      action: 'updated client status to Filed',
      time: '2 hours ago',
    },
    {
      id: '4',
      type: 'user_login',
      user: 'Mike Johnson',
      action: 'logged in',
      time: '3 hours ago',
    },
  ]

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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          System-wide overview and management
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {systemStats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <span className="text-2xl">{stat.icon}</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                {stat.trend === 'up' && (
                  <svg className="h-3 w-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                )}
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activity */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system-wide activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-3 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    {activity.type === 'user_signup' && '👤'}
                    {activity.type === 'document_upload' && '📄'}
                    {activity.type === 'status_update' && '✅'}
                    {activity.type === 'user_login' && '🔐'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user}</span>{' '}
                      <span className="text-muted-foreground">{activity.action}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Platform status and metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <div>
                    <p className="font-medium">API Status</p>
                    <p className="text-sm text-muted-foreground">All systems operational</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20">
                  Healthy
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <div>
                    <p className="font-medium">Database</p>
                    <p className="text-sm text-muted-foreground">99.9% uptime</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20">
                  Healthy
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <div>
                    <p className="font-medium">Storage</p>
                    <p className="text-sm text-muted-foreground">2.3 TB / 5 TB used</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20">
                  Healthy
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <div>
                    <p className="font-medium">Email Service</p>
                    <p className="text-sm text-muted-foreground">Rate limit approaching</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20">
                  Warning
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tax Professionals Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tax Professionals</CardTitle>
              <CardDescription>Overview of all tax professionals on the platform</CardDescription>
            </div>
            <Link href="/admin/tax-professionals">
              <Button>Manage Tax Pros</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
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
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20">
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
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Administrative tasks and management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button variant="outline" className="h-auto flex-col items-start p-4">
              <svg
                className="h-8 w-8 mb-2 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
              <span className="font-semibold">Add Tax Pro</span>
              <span className="text-xs text-muted-foreground">Create new tax professional</span>
            </Button>

            <Button variant="outline" className="h-auto flex-col items-start p-4">
              <svg
                className="h-8 w-8 mb-2 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <span className="font-semibold">View Reports</span>
              <span className="text-xs text-muted-foreground">System analytics and reports</span>
            </Button>

            <Link href="/admin/logs">
              <Button variant="outline" className="w-full h-auto flex-col items-start p-4">
                <svg
                  className="h-8 w-8 mb-2 text-primary"
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
                <span className="font-semibold">Audit Logs</span>
                <span className="text-xs text-muted-foreground">View system activity logs</span>
              </Button>
            </Link>

            <Button variant="outline" className="h-auto flex-col items-start p-4">
              <svg
                className="h-8 w-8 mb-2 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="font-semibold">Settings</span>
              <span className="text-xs text-muted-foreground">Configure system settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}