'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useFetchTaxProRequests } from '@/hooks/useDocumentRequests'
import { useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { TaxReturnStatus } from '@/graphql/types/users'
import { useClientUserStats } from '@/hooks/useUserQuery'
import useConversations from '@/hooks/useConversations'
import { useConversationMessages } from '@/hooks/useMessages'

export default function ClientDashboard() {
  const { user } = useAuth()
  const { requests, loading: requestsLoading, error: requestsError, fetchRequests } = useFetchTaxProRequests()
  const { stats: clientStats, loading: statsLoading } = useClientUserStats()
  const { conversations, loading: conversationsLoading } = useConversations()

  // Get the first conversation (most recent)
  const firstConversation = useMemo(() => {
    if (!conversations || conversations.length === 0) return null
    return conversations[0]
  }, [conversations])

  // Fetch messages from the first conversation
  const { messages: conversationMessages, loading: messagesLoading } = useConversationMessages({
    conversationId: firstConversation?.conversationId || null,
    limit: 5
  })

  useEffect(() => {
    fetchRequests(5)
  }, [fetchRequests])

  // Get current user's tax return status
  const currentStatus: TaxReturnStatus = user?.taxReturnStatus || 'DOCUMENTS_PENDING'

  // Define status steps in order
  const statusSteps: { key: TaxReturnStatus; label: string }[] = [
    { key: 'DOCUMENTS_PENDING', label: 'Documents Pending' },
    { key: 'DOCUMENTS_RECEIVED', label: 'Documents Received' },
    { key: 'IN_PROGRESS', label: 'In Progress' },
    { key: 'READY_FOR_REVIEW', label: 'Ready for Review' },
    { key: 'FILED', label: 'Filed' },
    { key: 'COMPLETE', label: 'Complete' },
  ]

  // Get current step index
  const currentStepIndex = useMemo(() => {
    return statusSteps.findIndex(step => step.key === currentStatus)
  }, [currentStatus])

  // Transform messages for the dashboard - only show messages from tax professional
  const recentMessages = useMemo(() => {
    if (!conversationMessages || !user || conversationMessages.length === 0) return []

    // Filter out current user's messages - only show messages from tax professional
    const otherUserMessages = conversationMessages.filter(msg => msg.senderId !== user.id)

    // Get the latest 2 messages from tax professional
    return otherUserMessages.slice(0, 2).map((msg) => {
      const sender = msg.sender || msg.receiver
      const senderName = sender?.name || 'Tax Professional'

      // Format timestamp
      const msgDate = new Date(msg.timestamp)
      const now = new Date()
      const diffMs = now.getTime() - msgDate.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      let dateStr = ''
      if (diffMins < 1) dateStr = 'Just now'
      else if (diffMins < 60) dateStr = `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
      else if (diffHours < 24) dateStr = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
      else if (diffDays === 1) dateStr = '1 day ago'
      else if (diffDays < 7) dateStr = `${diffDays} days ago`
      else dateStr = msgDate.toLocaleDateString()

      return {
        id: msg.messageId,
        from: senderName,
        subject: msg.messageType === 'IMAGE' ? '📷 Image attachment' : 'Message',
        preview: msg.content || 'Sent an attachment',
        date: dateStr,
        unread: msg.isSeenStatus === 'UNSEEN',
      }
    })
  }, [conversationMessages, user])

  const stats = [
    { label: 'Documents Uploaded', value: clientStats?.documentsUploaded?.toString() || '0', icon: '📄' },
    { label: 'Messages', value: clientStats?.unreadMessages?.toString() || '0', icon: '💬' },
    { label: 'Pending Requests', value: clientStats?.pendingRequest?.toString() || '0', icon: '⏳' },
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
                // Color this step if it's at or before the current step
                const isColored = index <= currentStepIndex
                const isActive = index === currentStepIndex

                return (
                  <div key={step.key} className="flex-1 flex items-center">
                    <div className="flex flex-col items-center w-full">
                      <div
                        className={`w-full h-2 rounded-full transition-all ${
                          isColored
                            ? 'bg-primary'
                            : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      />
                      <span
                        className={`text-xs mt-2 text-center transition-all ${
                          isColored
                            ? 'text-primary font-medium'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {index < statusSteps.length - 1 && (
                      <div
                        className={`w-4 h-0.5 transition-all ${
                          index < currentStepIndex
                            ? 'bg-primary'
                            : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      />
                    )}
                  </div>
                )
              })}
            </div>

            <Separator />

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Current Status:</strong>{' '}
                {currentStatus === 'DOCUMENTS_PENDING' && 'Waiting for your documents to be uploaded.'}
                {currentStatus === 'DOCUMENTS_RECEIVED' && 'Documents received. Your tax professional will begin processing soon.'}
                {currentStatus === 'IN_PROGRESS' && 'Your tax return is currently being prepared.'}
                {currentStatus === 'READY_FOR_REVIEW' && 'Your tax return is ready for review.'}
                {currentStatus === 'FILED' && 'Your tax return has been filed with the IRS.'}
                {currentStatus === 'COMPLETE' && 'Your tax return process is complete!'}
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
              <Badge variant="destructive">{requests.filter(req => req.status === 'PENDING').length}</Badge>
            </div>
            <CardDescription>Documents requested by your tax professional</CardDescription>
          </CardHeader>
          <CardContent>
            {requestsLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading requests...</p>
              </div>
            ) : requestsError ? (
              <div className="text-center py-8">
                <p className="text-red-600">Failed to load requests</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No pending requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.slice(0, 5).map((request) => (
                  <div
                    key={request.documentRequestId}
                    className="flex items-start justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{request.documentType.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {new Date(request.dueDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                      {request.status && (
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20">
                          {request.status}
                        </Badge>
                      )}
                    </div>
                    <Badge
                      variant={request.priority === 'HIGH' ? 'destructive' : 'secondary'}
                    >
                      {request.priority.toLowerCase()}
                    </Badge>
                  </div>
                ))}

                <Link href="/client/documents">
                  <Button className="w-full" variant="outline">
                    Upload Documents
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Messages */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Messages</CardTitle>
            <CardDescription>Latest messages from your tax professional</CardDescription>
          </CardHeader>
          <CardContent>
            {messagesLoading || conversationsLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading messages...</p>
              </div>
            ) : recentMessages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No messages yet</p>
              </div>
            ) : (
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
                        {/* {message.unread && (
                          <Badge variant="default" className="text-xs">New</Badge>
                        )} */}
                      </div>
                      <span className="text-xs text-muted-foreground">{message.date}</span>
                    </div>
                    <p className="text-sm font-medium mb-1">{message.subject}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {message.preview}
                    </p>
                  </div>
                ))}
                
                <Link href={`/messages/?conversation=${firstConversation?.conversationId ?? ''}`}>
                  <Button className="w-full" variant="outline">
                    View All Messages
                  </Button>
                </Link>
              </div>
            )}
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
            <Link href="/documents/${userId}">
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

            <Link href="/messages">
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

            <Link href="/documents">
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