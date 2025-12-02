import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function TaxProClientsPage() {
  // TODO: Fetch from API
  const clients = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      status: 'in_progress',
      pendingDocs: 2,
      unreadMessages: 1,
      lastActivity: '2 hours ago',
      taxYear: 2025,
      phone: '(555) 123-4567',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      status: 'ready_for_review',
      pendingDocs: 0,
      unreadMessages: 0,
      lastActivity: '1 day ago',
      taxYear: 2025,
      phone: '(555) 234-5678',
    },
    {
      id: '3',
      name: 'Mike Johnson',
      email: 'mike@example.com',
      status: 'documents_pending',
      pendingDocs: 3,
      unreadMessages: 2,
      lastActivity: '3 days ago',
      taxYear: 2025,
      phone: '(555) 345-6789',
    },
    {
      id: '4',
      name: 'Sarah Williams',
      email: 'sarah@example.com',
      status: 'filed',
      pendingDocs: 0,
      unreadMessages: 0,
      lastActivity: '1 week ago',
      taxYear: 2025,
      phone: '(555) 456-7890',
    },
    {
      id: '5',
      name: 'David Brown',
      email: 'david@example.com',
      status: 'complete',
      pendingDocs: 0,
      unreadMessages: 0,
      lastActivity: '2 weeks ago',
      taxYear: 2024,
      phone: '(555) 567-8901',
    },
  ]

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

  const stats = [
    { label: 'Total Clients', value: '24', icon: '👥' },
    { label: 'Active Returns', value: '12', icon: '📋' },
    { label: 'Needs Attention', value: '5', icon: '⚠️' },
    { label: 'Completed', value: '7', icon: '✅' },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground mt-2">
            Manage your clients and their tax returns
          </p>
        </div>
        <Button size="lg">
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
          Add Client
        </Button>
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

      {/* Search & Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
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
              <Input placeholder="Search clients..." className="pl-10" />
            </div>
            <Select defaultValue="all-status">
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-status">All Statuses</SelectItem>
                <SelectItem value="documents_pending">Docs Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="ready_for_review">Ready for Review</SelectItem>
                <SelectItem value="filed">Filed</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="2025">
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tax year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
          <CardDescription>View and manage your client list</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Pending Docs</TableHead>
                <TableHead className="text-center">Messages</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Tax Year</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{client.name}</p>
                      <p className="text-sm text-muted-foreground">{client.email}</p>
                    </div>
                  </TableCell>
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
                  <TableCell>{client.taxYear}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                      <Button variant="ghost" size="sm">
                        <svg
                          className="h-4 w-4"
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
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
