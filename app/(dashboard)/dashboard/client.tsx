'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { TaxReturnStatus } from '@/graphql/types/users'
import { useClientUserStats } from '@/hooks/useUserQuery'
import useConversations from '@/hooks/useConversations'
import { useConversationMessages } from '@/hooks/useMessages'
import { useFetchTaxProRequests } from '@/hooks/useDocumentRequests'

// Dashboard components
import {
  PageHeader,
  StatCardGrid,
  ConditionalRender,
  AlertBanner,
} from '@/components/dashboard/common'
import { RequestsSection, MessagesSection, QuickActions } from '@/components/dashboard/Sections'
import { ProgressTracker, DeadlineSection } from '@/components/dashboard/ProgressTracker'

// Types and utilities
import { StatCardData, DashboardMessage } from '@/lib/dashboard/types'
import {
  formatRelativeTime,
  calculateDaysUntil,
  getDeadlineDate,
} from '@/lib/dashboard/utils'

/**
 * Client Dashboard Component
 * Displays tax return progress, pending requests, and messages
 */
export default function ClientDashboard() {
  const { user } = useAuth()
  const { requests, loading: requestsLoading, error: requestsError, fetchRequests } =
    useFetchTaxProRequests()
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
    limit: 5,
  })

  useEffect(() => {
    fetchRequests(5)
  }, [fetchRequests])

  // ============ Status and Deadlines ============
  const currentStatus: TaxReturnStatus = (user?.taxReturnStatus as TaxReturnStatus) || 'DOCUMENTS_PENDING'

  const statusSteps: { key: TaxReturnStatus; label: string }[] = [
    { key: 'DOCUMENTS_PENDING', label: 'Documents Pending' },
    { key: 'DOCUMENTS_RECEIVED', label: 'Documents Received' },
    { key: 'IN_PROGRESS', label: 'In Progress' },
    { key: 'READY_FOR_REVIEW', label: 'Ready for Review' },
    { key: 'FILED', label: 'Filed' },
    { key: 'COMPLETE', label: 'Complete' },
  ]

  const daysUntilDeadline = useMemo(() => calculateDaysUntil(getDeadlineDate(3, 15)), [])
  const daysUntilInternalDeadline = useMemo(() => calculateDaysUntil(getDeadlineDate(2, 1)), [])

  // ============ Stats Cards ============
  const statsCards: StatCardData[] = useMemo(
    () => [
      {
        label: 'Documents Uploaded',
        value: clientStats?.documentsUploaded?.toString() || '0',
        icon: '📄',
      },
      {
        label: 'Messages',
        value: clientStats?.unreadMessages?.toString() || '0',
        icon: '💬',
      },
      {
        label: 'Pending Requests',
        value: clientStats?.pendingRequest?.toString() || '0',
        icon: '⏳',
      },
      {
        label: 'Days Until Deadline',
        value: daysUntilDeadline.toString(),
        icon: '📅',
        description: 'Time remaining to complete your 2025 tax return',
      },
    ],
    [clientStats, daysUntilDeadline]
  )

  // ============ Transform Messages ============
  const recentMessages: DashboardMessage[] = useMemo(() => {
    if (!conversationMessages || !user || conversationMessages.length === 0) return []

    const otherUserMessages = conversationMessages.filter((msg) => msg.senderId !== user.id)

    return otherUserMessages.slice(0, 2).map((msg) => {
      const sender = msg.sender || msg.receiver
      const senderName = sender?.name || 'Tax Professional'

      return {
        id: msg.messageId,
        from: senderName,
        subject: msg.messageType === 'IMAGE' ? '📷 Image attachment' : 'Message',
        preview: msg.content || 'Sent an attachment',
        date: formatRelativeTime(msg.timestamp),
        unread: msg.isSeenStatus === 'UNSEEN',
      }
    })
  }, [conversationMessages, user])

  // ============ Quick Actions ============
  const quickActions = [
    {
      label: 'Upload Documents',
      description: 'Add tax forms and receipts',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
      ),
      href: '/documents',
    },
    {
      label: 'Send Message',
      description: 'Contact your tax professional',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      ),
      href: '/messages',
    },
    {
      label: 'View Documents',
      description: 'Browse your uploaded files',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      href: '/documents',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Welcome back!"
        description="Here's an overview of your tax return progress"
      />

      {/* Stats Cards */}
      <StatCardGrid stats={statsCards} />

      {/* Deadlines Section */}
      <DeadlineSection
        daysUntilDeadline={daysUntilDeadline}
        daysUntilInternalDeadline={daysUntilInternalDeadline}
      />

      {/* Status Tracker */}
      <ProgressTracker currentStatus={currentStatus} statusSteps={statusSteps} />

      {/* Requests and Messages Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <RequestsSection
          requests={requests}
          isLoading={requestsLoading}
          error={requestsError}
        />
        <MessagesSection messages={recentMessages} isLoading={messagesLoading || conversationsLoading} />
      </div>

      {/* Quick Actions */}
      <QuickActions actions={quickActions} />

      {/* Critical Alert if Deadline Approaching */}
      {daysUntilInternalDeadline <= 7 && (
        <AlertBanner
          type="warning"
          title="⚠️ Action Required Soon"
          message={`You have ${daysUntilInternalDeadline} days to complete your documents to avoid delays in processing.`}
        />
      )}
    </div>
  )
}
