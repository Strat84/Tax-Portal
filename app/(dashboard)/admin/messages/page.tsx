import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function AdminMessagesPage() {
  // TODO: Fetch from API
  const stats = [
    { label: 'Total Messages', value: '1,247', icon: '💬' },
    { label: 'Today', value: '34', icon: '📅' },
    { label: 'Avg Response Time', value: '2.3h', icon: '⏱️' },
    { label: 'Active Conversations', value: '156', icon: '🔄' },
  ]

  const recentMessages = [
    {
      id: '1',
      from: 'John Doe',
      to: 'Sarah Johnson',
      fromRole: 'client',
      toRole: 'tax_pro',
      subject: 'Document upload',
      preview: 'Sure, I\'ll upload them today.',
      timestamp: '10 minutes ago',
      status: 'unread',
    },
    {
      id: '2',
      from: 'Mike Johnson',
      to: 'Sarah Johnson',
      fromRole: 'client',
      toRole: 'tax_pro',
      subject: 'Tax deadline question',
      preview: 'When is the deadline?',
      timestamp: '1 hour ago',
      status: 'read',
    },
    {
      id: '3',
      from: 'Sarah Johnson',
      to: 'Jane Smith',
      fromRole: 'tax_pro',
      toRole: 'client',
      subject: 'Return filed successfully',
      preview: 'Your tax return has been filed successfully!',
      timestamp: '2 hours ago',
      status: 'read',
    },
    {
      id: '4',
      from: 'Jane Smith',
      to: 'Sarah Johnson',
      fromRole: 'client',
      toRole: 'tax_pro',
      subject: 'Thank you',
      preview: 'Thank you for the update!',
      timestamp: '3 hours ago',
      status: 'read',
    },
  ]

  const conversationStats = [
    {
      id: '1',
      taxPro: 'Sarah Johnson',
      clients: 24,
      totalMessages: 342,
      avgResponseTime: '1.8h',
      unreadCount: 5,
    },
    {
      id: '2',
      taxPro: 'Michael Chen',
      clients: 18,
      totalMessages: 267,
      avgResponseTime: '2.1h',
      unreadCount: 3,
    },
    {
      id: '3',
      taxPro: 'Emily Rodriguez',
      clients: 31,
      totalMessages: 489,
      avgResponseTime: '2.7h',
      unreadCount: 8,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Message Management</h1>
        <p className="text-muted-foreground mt-2">
          Monitor and manage all platform communications
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

      <Tabs defaultValue="recent">
        <TabsList>
          <TabsTrigger value="recent">Recent Messages</TabsTrigger>
          <TabsTrigger value="stats">Tax Pro Statistics</TabsTrigger>
        </TabsList>

        {/* Recent Messages Tab */}
        <TabsContent value="recent" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Messages</CardTitle>
                  <CardDescription>Latest communications across the platform</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-64">
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
                    <Input placeholder="Search messages..." className="pl-10" />
                  </div>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Messages</SelectItem>
                      <SelectItem value="unread">Unread Only</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Preview</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentMessages.map((msg) => (
                    <TableRow key={msg.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{msg.from}</p>
                          <Badge variant="outline" className="text-xs">
                            {msg.fromRole}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{msg.to}</p>
                          <Badge variant="outline" className="text-xs">
                            {msg.toRole}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{msg.subject}</TableCell>
                      <TableCell className="text-muted-foreground truncate max-w-xs">
                        {msg.preview}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {msg.timestamp}
                      </TableCell>
                      <TableCell>
                        {msg.status === 'unread' ? (
                          <Badge variant="default">Unread</Badge>
                        ) : (
                          <Badge variant="secondary">Read</Badge>
                        )}
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
        </TabsContent>

        {/* Tax Pro Statistics Tab */}
        <TabsContent value="stats" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Tax Professional Performance</CardTitle>
              <CardDescription>Message statistics by tax professional</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tax Professional</TableHead>
                    <TableHead className="text-center">Active Clients</TableHead>
                    <TableHead className="text-center">Total Messages</TableHead>
                    <TableHead className="text-center">Avg Response Time</TableHead>
                    <TableHead className="text-center">Unread</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conversationStats.map((stat) => (
                    <TableRow key={stat.id}>
                      <TableCell className="font-medium">{stat.taxPro}</TableCell>
                      <TableCell className="text-center">{stat.clients}</TableCell>
                      <TableCell className="text-center">{stat.totalMessages}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{stat.avgResponseTime}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {stat.unreadCount > 0 ? (
                          <Badge variant="destructive">{stat.unreadCount}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Insights */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Message Volume</CardTitle>
            <CardDescription>Messages sent over the past 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                const value = [45, 52, 38, 61, 48, 23, 19][i]
                return (
                  <div key={day} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-8">{day}</span>
                    <div className="flex-1 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${(value / 61) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8 text-right">{value}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Response Time Distribution</CardTitle>
            <CardDescription>How quickly tax pros respond to clients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                <div>
                  <p className="font-medium">Under 1 hour</p>
                  <p className="text-sm text-muted-foreground">42% of messages</p>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20">
                  Excellent
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                <div>
                  <p className="font-medium">1-4 hours</p>
                  <p className="text-sm text-muted-foreground">35% of messages</p>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/20">
                  Good
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                <div>
                  <p className="font-medium">4-24 hours</p>
                  <p className="text-sm text-muted-foreground">18% of messages</p>
                </div>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20">
                  Average
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                <div>
                  <p className="font-medium">Over 24 hours</p>
                  <p className="text-sm text-muted-foreground">5% of messages</p>
                </div>
                <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/20">
                  Needs Improvement
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
