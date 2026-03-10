'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CardSection, SectionHeader, ConditionalRender } from './common'
import { DocumentRequestSummary } from '@/lib/dashboard/types'
import { formatDocumentType, formatDate } from '@/lib/dashboard/utils'

/**
 * Pending Document Requests Section
 * Shows document requests pending from client
 */
interface RequestsSectionProps {
  requests: DocumentRequestSummary[]
  isLoading?: boolean
  error?: string | null
  onUploadClick?: () => void
}

export function RequestsSection({ requests, isLoading = false, error = null, onUploadClick }: RequestsSectionProps) {
  const pendingRequests = requests.filter((r) => r.status === 'PENDING')

  return (
    <CardSection title="Pending Requests" description="Documents requested by your tax professional">
      <ConditionalRender
        isLoading={isLoading}
        error={error}
        isEmpty={pendingRequests.length === 0}
        emptyIcon="📭"
        emptyTitle="No pending requests"
        emptyText="You're all caught up! No documents are needed at this time."
        loadingText="Loading requests..."
      >
        <div className="space-y-4">
          {pendingRequests.slice(0, 5).map((request) => (
            <RequestCard key={request.documentRequestId} request={request} />
          ))}
          <Link href="/documents">
            <Button className="w-full" variant="outline">
              View All & Upload Documents
            </Button>
          </Link>
        </div>
      </ConditionalRender>
    </CardSection>
  )
}

/**
 * Individual Request Card
 */
interface RequestCardProps {
  request: DocumentRequestSummary
}

function RequestCard({ request }: RequestCardProps) {
  return (
    <div className="flex items-start justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
      <div className="space-y-1">
        <p className="font-medium">{formatDocumentType(request.documentType)}</p>
        <p className="text-sm text-muted-foreground">Due: {formatDate(request.dueDate)}</p>
        {request.status && (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20">
            {request.status}
          </Badge>
        )}
      </div>
      <Badge variant={request.priority === 'HIGH' ? 'destructive' : 'secondary'}>
        {request.priority.toLowerCase()}
      </Badge>
    </div>
  )
}

/**
 * Recent Messages Section
 * Shows latest messages from tax professional
 */
interface MessagesSectionProps {
  messages: any[]
  isLoading?: boolean
  error?: string | null
  onViewAll?: () => void
}

export function MessagesSection({ messages, isLoading = false, error = null, onViewAll }: MessagesSectionProps) {
  return (
    <CardSection title="Recent Messages" description="Latest messages from your tax professional">
      <ConditionalRender
        isLoading={isLoading}
        error={error}
        isEmpty={messages.length === 0}
        emptyIcon="💬"
        emptyTitle="No messages"
        emptyText="You have no messages yet."
        loadingText="Loading messages..."
      >
        <div className="space-y-4">
          {messages.map((message: any) => (
            <div
              key={message.id}
              className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="font-medium text-sm">{message.from}</p>
                <span className="text-xs text-muted-foreground">{message.date}</span>
              </div>
              <p className="text-sm font-medium mb-1">{message.subject}</p>
              <p className="text-sm text-muted-foreground line-clamp-2">{message.preview}</p>
            </div>
          ))}
          <Link href="/messages">
            <Button className="w-full" variant="outline">
              View All Messages
            </Button>
          </Link>
        </div>
      </ConditionalRender>
    </CardSection>
  )
}

/**
 * Quick Actions Grid
 * Common actions for dashboard users
 */
interface QuickAction {
  label: string
  description: string
  icon: React.ReactNode
  href: string
  onClick?: () => void
}

interface QuickActionsProps {
  actions: QuickAction[]
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <CardSection title="Quick Actions" description="Common tasks to help you get started">
      <div className="grid gap-4 md:grid-cols-3">
        {actions.map((action, index) => (
          <Link key={index} href={action.href}>
            <Button variant="outline" className="w-full h-auto flex-col items-start p-4" onClick={action.onClick}>
              <div className="h-8 w-8 mb-2 text-primary">{action.icon}</div>
              <span className="font-semibold">{action.label}</span>
              <span className="text-xs text-muted-foreground">{action.description}</span>
            </Button>
          </Link>
        ))}
      </div>
    </CardSection>
  )
}
