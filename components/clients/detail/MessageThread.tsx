/**
 * MessageThread component - displays message history with client
 */

'use client'

import Link from 'next/link'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export interface Message {
  id: string
  from: string
  preview: string
  date: string
  unread: boolean
}

interface MessageThreadProps {
  messages: Message[]
  clientName: string
  clientConversationId: string | null
  loading?: boolean
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export function MessageThread({
  messages,
  clientName,
  clientConversationId,
  loading,
}: MessageThreadProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Message History</CardTitle>
            <CardDescription>Recent messages with this client</CardDescription>
          </div>
          {clientConversationId && (
            <Link href={`/messages?conversation=${clientConversationId}`}>
              <Button size="sm">View Full Conversation</Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No messages yet</p>
            {clientConversationId && (
              <Link href={`/messages?conversation=${clientConversationId}`}>
                <Button size="sm" variant="outline">
                  Start Conversation
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {msg.from === 'You' ? 'YO' : getInitials(clientName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">{msg.from}</p>
                    <p className="text-xs text-muted-foreground">{msg.date}</p>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {msg.preview}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
