'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { useTaxProRequests } from '@/hooks/useDocumentRequests'
import { createDocumentRequest, approveDocumentRequest, rejectDocumentRequest } from '@/lib/api/requests'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/lib/db/supabase'

export default function TaxProDocumentRequestsPage() {
  const { user } = useAuth()
  const { requests, loading, error, refetch } = useTaxProRequests(user?.id || null)

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState('')
  const [documentType, setDocumentType] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('normal')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([])
  const [actionError, setActionError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  // Fetch clients assigned to this tax pro
  useEffect(() => {
    const fetchClients = async () => {
      if (!user) return

      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('clients')
          .select('id, user:users!clients_user_id_fkey(id, name)')
          .eq('tax_pro_id', user.id)

        if (error) throw error

        setClients(
          data.map((client: any) => ({
            id: client.id,
            name: client.user?.name || 'Unknown Client',
          }))
        )
      } catch (err) {
        console.error('Failed to fetch clients:', err)
      }
    }

    fetchClients()
  }, [user])

  const documentTypes = [
    'W-2 Form',
    'W-4 Form',
    '1099-INT',
    '1099-DIV',
    '1099-MISC',
    '1099-NEC',
    'Schedule C',
    'Schedule E',
    'Property Tax Statement',
    'Mortgage Interest Statement (1098)',
    'Student Loan Interest Statement',
    'Medical Expense Receipts',
    'Charitable Donation Receipts',
    'Business Expense Receipts',
    'Driver\'s License / ID',
    'Social Security Card',
    'Prior Year Tax Return',
    'Other Document',
  ]

  const stats = [
    {
      label: 'Active Requests',
      value: requests.filter((r) => r.status === 'pending').length.toString(),
      icon: '📋',
      color: 'text-blue-600',
    },
    {
      label: 'Awaiting Review',
      value: requests.filter((r) => r.status === 'uploaded').length.toString(),
      icon: '📤',
      color: 'text-orange-600',
    },
    {
      label: 'Completed',
      value: requests.filter((r) => r.status === 'approved').length.toString(),
      icon: '✅',
      color: 'text-green-600',
    },
    {
      label: 'Overdue',
      value: requests
        .filter((r) => {
          const due = new Date(r.dueDate)
          return r.status === 'pending' && due < new Date()
        })
        .length.toString(),
      icon: '⚠️',
      color: 'text-red-600',
    },
  ]

  const handleCreateRequest = async () => {
    if (!user) return

    try {
      setCreating(true)
      setActionError(null)

      await createDocumentRequest({
        clientId: selectedClient,
        taxProId: user.id,
        documentType,
        description,
        priority: priority as 'low' | 'normal' | 'high' | 'urgent',
        dueDate,
        notes,
      })

      await refetch()
      setCreateDialogOpen(false)

      // Reset form
      setSelectedClient('')
      setDocumentType('')
      setDescription('')
      setPriority('normal')
      setDueDate('')
      setNotes('')
    } catch (err: any) {
      console.error('Create request error:', err)
      setActionError(err.message || 'Failed to create request')
    } finally {
      setCreating(false)
    }
  }

  const handleBulkRequest = () => {
    // TODO: Implement bulk request creation in future
    console.log('Bulk requests - coming soon')
  }

  const handleApprove = async (requestId: string) => {
    try {
      setActionError(null)
      await approveDocumentRequest(requestId)
      await refetch()
    } catch (err: any) {
      console.error('Approve error:', err)
      setActionError(err.message || 'Failed to approve request')
    }
  }

  const handleReject = async (requestId: string) => {
    try {
      setActionError(null)
      await rejectDocumentRequest(requestId) // 'Document rejected by tax professional'
      await refetch()
    } catch (err: any) {
      console.error('Reject error:', err)
      setActionError(err.message || 'Failed to reject request')
    }
  }

  const filteredRequests = requests.filter((req) => {
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus
    const matchesSearch =
     ( req.clientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      ( req.documentType || '').toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const priorityConfig = {
    low: { badge: 'bg-slate-100 text-slate-800 dark:bg-slate-900/20', label: 'Low' },
    normal: { badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20', label: 'Normal' },
    high: { badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20', label: 'High' },
    urgent: { badge: 'bg-red-100 text-red-800 dark:bg-red-900/20', label: 'Urgent' },
  }

  const statusConfig = {
    pending: { badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20', label: 'Pending' },
    uploaded: { badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20', label: 'Uploaded' },
    approved: { badge: 'bg-green-100 text-green-800 dark:bg-green-900/20', label: 'Approved' },
    rejected: { badge: 'bg-red-100 text-red-800 dark:bg-red-900/20', label: 'Rejected' },
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading document requests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {(error || actionError) && (
        <Alert variant="destructive">
          <AlertDescription>{error || actionError}</AlertDescription>
        </Alert>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Document Requests</h1>
          <p className="text-muted-foreground mt-2">
            Request and manage client documents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="lg">
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                Bulk Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Bulk Document Request</DialogTitle>
                <DialogDescription>
                  Request the same document from multiple clients at once
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Select Clients</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Choose which clients should receive this request
                  </p>
                  <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                    {clients.map((client) => (
                      <label key={client.id} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">{client.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Document Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea placeholder="What do you need and why?" rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Priority</Label>
                    <Select defaultValue="normal">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low Priority</SelectItem>
                        <SelectItem value="normal">Normal Priority</SelectItem>
                        <SelectItem value="high">High Priority</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    <Input type="date" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline">Cancel</Button>
                <Button onClick={handleBulkRequest}>Create Bulk Request</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
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
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Document Request</DialogTitle>
                <DialogDescription>
                  Request a specific document from a client
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label>Client</Label>
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Document Type</Label>
                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Explain what you need and why..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Priority</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low Priority</SelectItem>
                        <SelectItem value="normal">Normal Priority</SelectItem>
                        <SelectItem value="high">High Priority</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label>Additional Notes (Optional)</Label>
                  <Textarea
                    placeholder="Any special instructions or details..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateRequest}
                  disabled={!selectedClient || !documentType || !description || !dueDate}
                >
                  Create Request
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <span className={`text-2xl ${stat.color}`}>{stat.icon}</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
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
                placeholder="Search by client or document type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="uploaded">Uploaded</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Document Requests</CardTitle>
          <CardDescription>Track and manage client document requests</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Document Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.clientName}</TableCell>
                  <TableCell>{request.documentType}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={priorityConfig[request.priority as keyof typeof priorityConfig].badge}
                    >
                      {priorityConfig[request.priority as keyof typeof priorityConfig].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(request.dueDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={statusConfig[request.status as keyof typeof statusConfig].badge}
                    >
                      {statusConfig[request.status as keyof typeof statusConfig].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(request.requestedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {request.status === 'uploaded' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApprove(request.id)}
                          >
                            <svg
                              className="h-4 w-4 mr-1 text-green-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Approve
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReject(request.id)}
                          >
                            <svg
                              className="h-4 w-4 mr-1 text-red-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            Reject
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="sm">
                        View
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
