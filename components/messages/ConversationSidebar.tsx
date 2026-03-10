'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import UserStatusBadge from '@/components/UserStatusBadge'
import { Conversation, ConversationSidebarProps } from '@/graphql/types/message'

export default function ConversationSidebar({
  conversations,
  selectedConversation,
  onSelectConversation,
  loading,
  searchQuery,
  onSearchChange,
}: ConversationSidebarProps) {
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) {
      return conversations
    }

    const query = searchQuery.toLowerCase().trim()
    return conversations.filter(conv =>
      conv.taxProName.toLowerCase().includes(query)
    )
  }, [conversations, searchQuery])

  return (
    <Card className="flex flex-col h-[calc(100vh-280px)]">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Conversations</CardTitle>
        <CardDescription>Your message threads</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto min-h-0">
        {/* Search */}
        <div className="mb-4 space-y-2">
          <div className="relative">
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
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-10"
            />
            {/* Clear button */}
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                title="Clear search"
              >
                <svg
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
              </button>
            )}
          </div>
          {/* Search results count */}
          {searchQuery.trim() && (
            <p className="text-xs text-muted-foreground">
              Found {filteredConversations.length} {filteredConversations.length === 1 ? 'conversation' : 'conversations'}
            </p>
          )}
        </div>

        {/* Conversation List */}
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">Loading conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                {searchQuery.trim()
                  ? `No conversations match "${searchQuery}"`
                  : 'No conversations found'}
              </p>
              {searchQuery.trim() && (
                <button
                  onClick={() => onSearchChange('')}
                  className="text-xs text-primary hover:underline mt-2"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedConversation === conv.id
                    ? 'bg-primary/10 border-2 border-primary'
                    : 'border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <UserStatusBadge
                    user={{
                      name: conv.taxProName,
                      status: conv.status ?? 'offline',
                    }}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-sm truncate">
                        {conv.taxProName}
                      </p>
                      {conv.unreadCount > 0 && (
                        <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.lastMessage}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {conv.lastMessageTime}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
