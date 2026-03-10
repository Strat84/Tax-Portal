'use client'

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import UserStatusBadge from '@/components/UserStatusBadge'
import { ConversationHeaderProps } from '@/graphql/types/message'

export default function ConversationHeader({ name, status }: ConversationHeaderProps) {
  return (
    <CardHeader className="border-b flex-shrink-0">
      <div className="flex items-center gap-3">
        <UserStatusBadge
          user={{
            name,
            status: status ?? 'offline',
          }}
          size="lg"
        />
        <div>
          <CardTitle className="text-lg">{name}</CardTitle>
          <CardDescription className="capitalize">
            {status ?? 'offline'}
          </CardDescription>
        </div>
      </div>
    </CardHeader>
  )
}
