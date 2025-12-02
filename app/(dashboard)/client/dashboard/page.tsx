import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default function ClientDashboard() {
  // TODO: Fetch actual data from API
  const currentStatus = 'in_progress'
  const statusSteps = [
    { key: 'documents_pending', label: 'Documents Pending', completed: true },
    { key: 'documents_received', label: 'Documents Received', completed: true },
    { key: 'in_progress', label: 'In Progress', completed: false },
    { key: 'ready_for_review', label: 'Ready for Review', completed: false },
    { key: 'filed', label: 'Filed', completed: false },
    { key: 'complete', label: 'Complete', completed: false },
  ]

  const pendingRequests = [
    {
      id: '1',
      document: 'W-2 from ABC Company',
      dueDate: '2025-02-15',
      priority: 'high',
    },
    {
      id: '2',
      document: '1099-INT from XYZ Bank',
      dueDate: '2025-02-20',
      priority: 'medium',
    },
  ]

  const recentMessages = [
    {
      id: '1',
      from: 'Sarah Johnson',
      subject: 'Updated tax forms available',
      preview: 'I've uploaded your completed tax forms to the portal...',
      date: '2 hours ago',
      unread: true,
    },
    {
      id: '2',
      from: 'Sarah Johnson',
      subject: 'Additional documents needed',
      preview: 'Could you please provide your 1099-INT form...',
      date: '1 day ago',
      unread: false,
    },
  ]

  const stats = [
    { label: 'Documents Uploaded', value: '12', icon: '📄' },
    { label: 'Messages', value: '8', icon: '💬' },
    { label: 'Pending Requests', value: '2', icon: '⏳' },
    { label: 'Days Until Deadline', value: '45', icon: '📅' },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
        <p className="text-muted-foreground mt-2">
          Here's an overview of your tax return progress
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
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status Tracker */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Return Status</CardTitle>
          <CardDescription>
            Your tax professional is currently working on your 2025 tax return
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="flex items-center gap-2">
              {statusSteps.map((step, index) => {
                const isActive = step.key === currentStatus
                const isCompleted = statusSteps.findIndex(s => s.key === currentStatus) > index

                return (
                  <div key={step.key} className="flex-1 flex items-center">
                    <div className="flex flex-col items-center w-full">
                      <div
                        className={`w-full h-2 rounded-full ${
                          isCompleted || isActive
                            ? 'bg-primary'
                            : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      />
                      <span className="text-xs mt-2 text-center">{step.label}</span>
                    </div>
                    {index < statusSteps.length - 1 && (
                      <div className="w-4 h-0.5 bg-slate-200 dark:bg-slate-700" />
                    )}
                  </div>
                )
              })}
            </div>

            <Separator />

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Current Status:</strong> Your tax return is currently being prepared.
                We're reviewing all your documents and will have an update soon.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Pending Document Requests */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pending Requests</CardTitle>
              <Badge variant="destructive">{pendingRequests.length}</Badge>
            </div>
            <CardDescription>Documents requested by your tax professional</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-start justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{request.document}</p>
                    <p className="text-sm text-muted-foreground">Due: {request.dueDate}</p>
                  </div>
                  <Badge
                    variant={request.priority === 'high' ? 'destructive' : 'secondary'}
                  >
                    {request.priority}
                  </Badge>
                </div>
              ))}

              <Link href="/client/documents">
                <Button className="w-full" variant="outline">
                  Upload Documents
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Messages */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Messages</CardTitle>
            <CardDescription>Latest messages from your tax professional</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMessages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                    message.unread ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{message.from}</p>
                      {message.unread && (
                        <Badge variant="default" className="text-xs">New</Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{message.date}</span>
                  </div>
                  <p className="text-sm font-medium mb-1">{message.subject}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {message.preview}
                  </p>
                </div>
              ))}

              <Link href="/client/messages">
                <Button className="w-full" variant="outline">
                  View All Messages
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to help you get started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/client/documents">
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
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <span className="font-semibold">Upload Documents</span>
                <span className="text-xs text-muted-foreground">Add tax forms and receipts</span>
              </Button>
            </Link>

            <Link href="/client/messages">
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
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <span className="font-semibold">Send Message</span>
                <span className="text-xs text-muted-foreground">Contact your tax professional</span>
              </Button>
            </Link>

            <Link href="/client/documents">
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
                <span className="font-semibold">View Documents</span>
                <span className="text-xs text-muted-foreground">Browse your uploaded files</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
