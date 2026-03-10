/**
 * QuickStats component - displays quick statistics about the client
 */

'use client'

import { Card, CardContent } from '@/components/ui/card'
import type { ClientDetailsInfo } from '@/graphql/types/clients'

interface QuickStatsProps {
  client: ClientDetailsInfo
}

interface StatItem {
  label: string
  value: string | number
}

export function QuickStats({ client }: QuickStatsProps) {
  const stats: StatItem[] = [
    {
      label: 'Pending Documents',
      value: client.pendingDocs,
    },
    {
      label: 'Unread Messages',
      value: client.unreadMessages,
    },
    {
      label: 'Documents Uploaded',
      value: client.documentsUploaded,
    },
    {
      label: 'Last Activity',
      value: client.lastActivity,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">{stat.label}</div>
            <div className={typeof stat.value === 'number' ? 'text-2xl font-bold mt-1' : 'text-lg font-semibold mt-1'}>
              {stat.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
