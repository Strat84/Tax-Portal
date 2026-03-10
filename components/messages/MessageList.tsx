'use client'

import { CardContent } from '@/components/ui/card'
import MessageAttachment from '@/components/messages/MessageAttachment'
import { UIMessage, MessageListProps } from '@/graphql/types/message'

export default function MessageList({
  messages,
  loading,
  isLoadingMore,
  containerRef,
  onScroll,
}: MessageListProps) {
  return (
    <CardContent
      ref={containerRef}
      onScroll={onScroll}
      className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0"
    >
      {isLoadingMore && (
        <div className="sticky top-0 z-10 text-center py-3 bg-background/95 backdrop-blur-sm border-b mb-2">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-primary">
            <svg
              className="h-5 w-5 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading more messages...
          </div>
        </div>
      )}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">Loading messages...</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
        </div>
      ) : (
        messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isFromCurrentUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.isFromCurrentUser
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-slate-100 dark:bg-slate-800'
              }`}
            >
              <p className="text-sm font-medium mb-1">{message.senderName}</p>
              {message.content && <p className="text-sm">{message.content}</p>}

              {/* Render attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="space-y-2">
                  {message.attachments.map((attachment, index) => (
                    <MessageAttachment
                      key={attachment.id || index}
                      attachment={attachment}
                      isFromCurrentUser={message.isFromCurrentUser}
                    />
                  ))}
                </div>
              )}

              <p className={`text-xs mt-2 ${
                message.isFromCurrentUser
                  ? 'text-primary-foreground/70'
                  : 'text-muted-foreground'
              }`}>
                {message.timestamp}
              </p>
            </div>
          </div>
        ))
      )}
    </CardContent>
  )
}
