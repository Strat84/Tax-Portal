'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DocumentRequestCard } from '@/components/documents/DocumentRequestCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/AuthContext'
import { useClientRequests } from '@/hooks/useDocumentRequests'
import { fulfillDocumentRequest } from '@/lib/api/requests'
import { uploadDocument } from '@/lib/api/documents'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function ClientDocumentRequestsPage() {
  const { user } = useAuth()
  const [clientId, setClientId] = useState<string | null>(null)
  const { requests, loading, error, refetch } = useClientRequests(clientId)

  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Fetch client ID for the current user
  useEffect(() => {
    const fetchClientId = async () => {
      if (!user) return

      try {
        // For clients, their user_id is the client_id in the clients table
        // The API should handle this, but for now we'll use user.id
        setClientId(user.id)
      } catch (err) {
        console.error('Failed to fetch client ID:', err)
      }
    }

    fetchClientId()
  }, [user])

  const handleUpload = async (requestId: string, file: File, notes: string) => {
    if (!user) return

    try {
      setUploadError(null)

      // Upload the file first
      const document = await uploadDocument(file, user.id, null)

      // Fulfill the document request with the uploaded file
      await fulfillDocumentRequest(requestId, document.id, notes)

      // Refresh the requests list
      await refetch()
    } catch (err: any) {
      console.error('Upload error:', err)
      setUploadError(err.message || 'Failed to upload document')
      throw err
    }
  }

  const filteredRequests = requests.filter((req) => {
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus
    const matchesPriority = filterPriority === 'all' || req.priority === filterPriority
    return matchesStatus && matchesPriority
  })

  const pendingRequests = requests.filter((r) => r.status === 'pending')
  const uploadedRequests = requests.filter((r) => r.status === 'uploaded')
  const completedRequests = requests.filter((r) => r.status === 'approved')

  const stats = [
    {
      label: 'Pending Requests',
      value: pendingRequests.length.toString(),
      icon: '⏳',
      color: 'text-yellow-600',
    },
    {
      label: 'Under Review',
      value: uploadedRequests.length.toString(),
      icon: '📤',
      color: 'text-blue-600',
    },
    {
      label: 'Completed',
      value: completedRequests.length.toString(),
      icon: '✅',
      color: 'text-green-600',
    },
    {
      label: 'Total Requests',
      value: requests.length.toString(),
      icon: '📋',
      color: 'text-slate-600',
    },
  ]

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
      {(error || uploadError) && (
        <Alert variant="destructive">
          <AlertDescription>{error || uploadError}</AlertDescription>
        </Alert>
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Document Requests</h1>
        <p className="text-muted-foreground mt-2">
          Your tax professional has requested the following documents
        </p>
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

      {/* Urgent Notice */}
      {pendingRequests.some((r) => {
        const daysUntil = Math.ceil(
          (new Date(r.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        )
        return daysUntil <= 3 && daysUntil >= 0
      }) && (
        <Card className="border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">⚡</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold">Action Required Soon</p>
              <p className="text-sm text-muted-foreground">
                You have{' '}
                {
                  pendingRequests.filter((r) => {
                    const daysUntil = Math.ceil(
                      (new Date(r.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                    )
                    return daysUntil <= 3 && daysUntil >= 0
                  }).length
                }{' '}
                document request(s) due within 3 days
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="all">
              All ({requests.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="uploaded">
              Under Review ({uploadedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedRequests.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* All Requests */}
        <TabsContent value="all" className="space-y-4">
          {filteredRequests.length > 0 ? (
            filteredRequests.map((request) => (
              <DocumentRequestCard key={request.id} request={request} onUpload={handleUpload} />
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-lg font-semibold mb-2">No requests found</h3>
                <p className="text-muted-foreground text-center">
                  Adjust your filters or check back later for new document requests
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Pending Only */}
        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length > 0 ? (
            pendingRequests.map((request) => (
              <DocumentRequestCard key={request.id} request={request} onUpload={handleUpload} />
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                <p className="text-muted-foreground text-center">
                  You have no pending document requests at this time
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Under Review */}
        <TabsContent value="uploaded" className="space-y-4">
          {uploadedRequests.length > 0 ? (
            uploadedRequests.map((request) => (
              <DocumentRequestCard key={request.id} request={request} onUpload={handleUpload} />
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-6xl mb-4">📤</div>
                <h3 className="text-lg font-semibold mb-2">No documents under review</h3>
                <p className="text-muted-foreground text-center">
                  Documents you upload will appear here while being reviewed
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Completed */}
        <TabsContent value="completed" className="space-y-4">
          {completedRequests.length > 0 ? (
            completedRequests.map((request) => (
              <DocumentRequestCard key={request.id} request={request} onUpload={handleUpload} />
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-lg font-semibold mb-2">No completed requests yet</h3>
                <p className="text-muted-foreground text-center">
                  Approved documents will appear here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Help Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>💡</span>
            Tips for Uploading Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Make sure all text and numbers are clearly visible</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Upload high-quality scans or photos (not blurry)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Include all pages of multi-page documents</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Use PDF format when possible for best quality</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Add notes if you have questions about a specific request</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
