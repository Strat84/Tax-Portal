'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
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
import { useListUsers, useTaxProUserStats } from '@/hooks/useUserQuery'
import { formatRelativeTime } from '@/lib/utils'

export default function TaxProClientsPage() {
  const { users, loading, loadingMore, loadMore, hasMore } = useListUsers(10)
  const { stats: taxProStats } = useTaxProUserStats()
  const observerTarget = useRef<HTMLDivElement>(null)

  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all-status')
  const [yearFilter, setYearFilter] = useState('2025')

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [hasMore, loadingMore, loadMore])

  // Map API users to client format with dynamic name and lastActivity
  const clients = users?.map((user) => ({
    id: user.id,
    name: user.name,
    lastname: user.lastname,
    email: user.email,
    status: user.taxReturnStatus, // Use actual tax return status instead of role
    lastActivity: formatRelativeTime(user.lastActiveAt),
    taxYear: 2025, // Static for now
    phone: user.phone || 'N/A',
    pendingDocs: user.pendingRequest ,
    unreadMessages: user.unreadMessages

  })) || []

  // Filter clients based on search term and filters
  const filteredClients = clients.filter((client) => {
    // Search by name or lastname or email
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = 
      client.name.toLowerCase().includes(searchLower) ||
      client.lastname.toLowerCase().includes(searchLower) ||
      client.email.toLowerCase().includes(searchLower)

    // Filter by status
    const matchesStatus = 
      statusFilter === 'all-status' || 
      client.status === statusFilter

    // Filter by tax year
    const matchesYear = 
      yearFilter === 'all' || 
      client.taxYear.toString() === yearFilter

    return matchesSearch && matchesStatus && matchesYear
  })

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

  const stats = [
    { label: 'Total Clients', value: taxProStats?.totalClients?.toString() || '0', icon: '👥' },
    { label: 'Active Returns', value: taxProStats?.activeReturns?.toString() || '0', icon: '📋' },
    { label: 'Needs Attention', value: taxProStats?.needAttention?.toString() || '0', icon: '⚠️' },
    { label: 'Completed', value: taxProStats?.completedReturns?.toString() || '0', icon: '✅' },
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
        {/* <Button size="lg">
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
        </Button> */}
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
              <Input 
                placeholder="Search clients..." 
                className="pl-10" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
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
            <Select value={yearFilter} onValueChange={setYearFilter}>
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 dark:border-gray-100"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    {searchTerm || statusFilter !== 'all-status' || yearFilter !== '2025' 
                      ? 'No clients match your search or filters' 
                      : 'No clients found'}
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <Link href={`/clients/${client.id}`}>
                          <div>
                            <p className="font-medium hover:underline">{client.name} {client.lastname}</p>
                            <p className="text-sm text-muted-foreground">{client.email}</p>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        {client.status ? (
                          <Badge className={statusColors[client.status]} variant="outline">
                            {statusLabels[client.status]}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {typeof client.pendingDocs === "number" && client.pendingDocs > 0 ? (
                          <Badge variant="destructive">{client.pendingDocs}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {typeof client.unreadMessages === "number" && client.unreadMessages > 0 ? (
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
                          <Link href={`/clients/${client.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                          <Link href={`/messages?client=${client.id}`}>
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
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Infinite scroll trigger and loading indicator */}
                  {hasMore && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        <div ref={observerTarget}>
                          {loadingMore && (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-gray-100"></div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
