'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import UserStatusBadge from '@/components/UserStatusBadge'
import { UserStatus } from '@/graphql/types/users'
import useConversations from '@/hooks/useConversations'
import useCurrentUser from '@/hooks/useUserQuery'
import { useConversationMessages, useCreateMessage } from '@/hooks/useMessages'
import FileAttachment, { FilePreview, FilePreviewCard } from '@/components/messages/FileAttachment'
import MessageAttachment from '@/components/messages/MessageAttachment'
import { uploadFileToS3, isImageFile, UploadProgress } from '@/lib/storage/fileUpload'
import { v4 as uuidv4 } from 'uuid'
import { MessageType } from '@/graphql/types/message'

export default function ClientMessagesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [composeDialogOpen, setComposeDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null)

  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const previousScrollHeightRef = useRef<number>(0)
  const lastMessageIdRef = useRef<string | null>(null)
  const loadingStartTimeRef = useRef<number>(0)

  const { conversations: conversationsData, loading: conversationsLoading, updateConversation } = useConversations()
  const { user: currentUser } = useCurrentUser()
  const { messages: messagesData, loading: messagesLoading, nextToken, loadMore } = useConversationMessages({
    conversationId: selectedConversation,
    limit: 5
  })
  const { createMessage, loading: createMessageLoading } = useCreateMessage()

  // Read conversation ID from URL on mount
  useEffect(() => {
    const conversationId = searchParams.get('conversation')
    if (conversationId && !selectedConversation) {
      setSelectedConversation(conversationId)
    }
  }, [searchParams, selectedConversation])

  // Transform API data to match UI structure
  const conversations = useMemo(() => {
    if (!conversationsData || !currentUser) return []

    return conversationsData.map((conv) => {
      // Get the other user (not current user)
      const otherUser = conv.user1Id === currentUser.id ? conv.user2 : conv.user1

      return {
        id: conv.conversationId,
        taxProName: otherUser.name,
        taxProInitials: otherUser.name
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase(),
        lastMessage: conv.lastMessage || 'No messages yet',
        lastMessageTime: conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleDateString() : 'N/A',
        unreadCount: conv.unreadCount,
        isActive: otherUser.isActive,
        status: otherUser.status,
      }
    })
  }, [conversationsData, currentUser])

  // Transform messages data for UI
  const messages = useMemo(() => {
    if (!messagesData || !currentUser) return []

    const transformed = messagesData
      .map((msg) => {
        const isFromCurrentUser = msg.senderId === currentUser.id
        const sender = msg.sender || msg.receiver // Handle both sender/receiver

        return {
          id: msg.messageId,
          senderId: msg.senderId,
          senderName: isFromCurrentUser ? 'You' : (sender?.name || 'Unknown'),
          content: msg.content,
          timestamp: new Date(msg.timestamp).toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }),
          isFromCurrentUser,
          messageType: msg.messageType,
          attachments: msg.attachments,
        }
      })
      .reverse() // Backend returns newest first, reverse to display oldest first at top

    return transformed
  }, [messagesData, currentUser])

  // Function to scroll to bottom of messages
  const scrollToBottom = useCallback((smooth: boolean = false) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      })
    }
  }, [])

  // Scroll to bottom when conversation changes or new message is received
  useEffect(() => {
    // Get the last message (newest message at the end of the array)
    const lastMessage = messages[messages.length - 1]
    const currentLastMessageId = lastMessage?.id || null

    // Only scroll to bottom if:
    // 1. Conversation changed (selectedConversation changed)
    // 2. A new message was added at the end (lastMessageId changed)
    // 3. Not currently loading more old messages
    const shouldScrollToBottom =
      !isLoadingMore &&
      (lastMessageIdRef.current !== currentLastMessageId || !lastMessageIdRef.current)

    if (shouldScrollToBottom) {
      scrollToBottom(false)
      lastMessageIdRef.current = currentLastMessageId
    }

    // Reset lastMessageId when conversation changes
    if (selectedConversation !== lastMessageIdRef.current) {
      lastMessageIdRef.current = currentLastMessageId
    }
  }, [selectedConversation, messages, isLoadingMore, scrollToBottom])

  // Restore scroll position after loading more messages
  useEffect(() => {
    if (isLoadingMore && messagesContainerRef.current) {
      const newScrollHeight = messagesContainerRef.current.scrollHeight
      const scrollDiff = newScrollHeight - previousScrollHeightRef.current
      messagesContainerRef.current.scrollTop = scrollDiff

      // Ensure loading indicator shows for at least 500ms
      const elapsedTime = Date.now() - loadingStartTimeRef.current
      const minimumLoadingTime = 500 // milliseconds

      if (elapsedTime < minimumLoadingTime) {
        setTimeout(() => {
          setIsLoadingMore(false)
        }, minimumLoadingTime - elapsedTime)
      } else {
        setIsLoadingMore(false)
      }
    }
  }, [messages.length, isLoadingMore])

  // Handle scroll event for pagination
  const handleScroll = async () => {
    const container = messagesContainerRef.current
    if (!container || isLoadingMore || messagesLoading || !nextToken) return

    // Check if scrolled to top (with 50px threshold)
    if (container.scrollTop < 50) {
      loadingStartTimeRef.current = Date.now() // Record loading start time
      setIsLoadingMore(true)
      previousScrollHeightRef.current = container.scrollHeight

      try {
        await loadMore()
      } catch (error) {
        console.error('Failed to load more messages:', error)
        setIsLoadingMore(false)
      }
    }
  }

  const handleFileSelect = (file: File) => {
    // Create preview for images
    let preview: string | undefined
    if (isImageFile(file)) {
      preview = URL.createObjectURL(file)
    }

    setFilePreview({
      file,
      preview,
      uploading: false,
      progress: 0,
    })
  }

  const handleRemoveFile = () => {
    if (filePreview?.preview) {
      URL.revokeObjectURL(filePreview.preview)
    }
    setFilePreview(null)
  }

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !filePreview) || !selectedConversation || !currentUser) return

    // Find the original conversation to get the receiver info
    const selectedConvData = conversationsData?.find(conv => conv.conversationId === selectedConversation)
    if (!selectedConvData) return

    // Determine the receiver (the other user in the conversation)
    const receiverId = selectedConvData.user1Id === currentUser.id
      ? selectedConvData.user2Id
      : selectedConvData.user1Id

    const timestamp = new Date().toISOString()
    const messageId = uuidv4()

    try {
      let attachments = null
      let messageType: MessageType = 'TEXT'

      // Handle file upload if present
      if (filePreview) {
        setFilePreview(prev => prev ? { ...prev, uploading: true, progress: 0 } : null)

        const uploadResult = await uploadFileToS3(
          filePreview.file,
          selectedConversation,
          messageId,
          (progress: UploadProgress) => {
            setFilePreview(prev => prev ? { ...prev, progress: progress.percentage } : null)
          }
        )

        attachments = [uploadResult]
        messageType = isImageFile(filePreview.file) ? 'IMAGE' : 'TEXT'
      }

      await createMessage({
        GSI1PK: `USER#${currentUser.id}`,
        GSI1SK: `MSG#${timestamp}`,
        content: newMessage.trim() || (filePreview ? filePreview.file.name : ''),
        conversationId: selectedConversation,
        isSeenStatus: 'UNSEEN',
        receiverId,
        messageType,
        senderId: currentUser.id,
        timestamp,
        ...(attachments && { attachments }),
      })

      setNewMessage('')
      handleRemoveFile()

      // Scroll to bottom after sending message (with small delay to ensure message is rendered)
      setTimeout(() => {
        scrollToBottom(true)
      }, 100)
    } catch (error) {
      console.error('Failed to send message:', error)
      if (filePreview) {
        setFilePreview(prev => prev ? {
          ...prev,
          uploading: false,
          error: 'Failed to upload file. Please try again.',
        } : null)
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleConversationClick = async (conversationId: string) => {
    // Set selected conversation immediately for better UX
    setSelectedConversation(conversationId)

    // Update URL with conversation ID
    router.push(`/messages?conversation=${conversationId}`, { scroll: false })

    // Find the original conversation data with PK and SK
    const originalConv = conversationsData?.find(conv => conv.conversationId === conversationId)

    // If conversation has unread messages, mark them as read
    if (originalConv && originalConv.unreadCount > 0) {
      try {
        await updateConversation({
          PK: originalConv.PK,
          SK: originalConv.SK,
          unreadCount: 0
        })
      } catch (error) {
        console.error('Failed to update conversation:', error)
      }
    }
  }

  // Search logic - only search by name
  const filteredConversations = useMemo(() => {
    // If no search query, return all conversations
    if (!searchQuery.trim()) {
      return conversations
    }

    const query = searchQuery.toLowerCase().trim()

    return conversations.filter(conv => {
      // Search only in tax professional name
      return conv.taxProName.toLowerCase().includes(query)
    })
  }, [conversations, searchQuery])

  const selectedConv = conversations.find(c => c.id === selectedConversation)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
          <p className="text-muted-foreground mt-2">
            Communicate with your tax professional
          </p>
        </div>
        {/* Commented out New Message button - not needed */}
        {/* <Dialog open={composeDialogOpen} onOpenChange={setComposeDialogOpen}>
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
              New Message
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Message</DialogTitle>
              <DialogDescription>
                Send a message to your tax professional
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Subject</label>
                <Input placeholder="Enter subject..." />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Message</label>
                <Textarea
                  placeholder="Type your message..."
                  rows={6}
                  className="resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setComposeDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setComposeDialogOpen(false)}>
                Send Message
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog> */}
      </div>

      {/* Messages Interface */}
      <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
        {/* Conversations Sidebar */}
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                />
                {/* Clear button */}
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
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
              {conversationsLoading ? (
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
                      onClick={() => setSearchQuery('')}
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
                  onClick={() => handleConversationClick(conv.id)}
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

        {/* Message Thread */}
        {selectedConv ? (
          <Card className="flex flex-col h-[calc(100vh-280px)]">
            <CardHeader className="border-b flex-shrink-0">
              <div className="flex items-center gap-3">
                <UserStatusBadge
                  user={{
                    name: selectedConv.taxProName,
                    status: selectedConv.status ?? 'offline',
                  }}
                  size="lg"
                />
                <div>
                  <CardTitle className="text-lg">{selectedConv.taxProName}</CardTitle>
                  <CardDescription className="capitalize">
                    {selectedConv.status ?? 'offline'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent
              ref={messagesContainerRef}
              onScroll={handleScroll}
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
              {messagesLoading ? (
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

            {/* Message Input */}
            <div className="border-t p-4 flex-shrink-0">
              {/* File Preview */}
              {filePreview && (
                <FilePreviewCard
                  filePreview={filePreview}
                  onRemove={handleRemoveFile}
                />
              )}

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    rows={3}
                    className="resize-none"
                    disabled={createMessageLoading || filePreview?.uploading}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Press Enter to send, Shift+Enter for new line
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <FileAttachment
                    onFileSelect={handleFileSelect}
                    onRemove={handleRemoveFile}
                    disabled={createMessageLoading || !!filePreview}
                  />
                  <Button
                    onClick={handleSendMessage}
                    size="icon"
                    disabled={
                      createMessageLoading ||
                      filePreview?.uploading ||
                      (!newMessage.trim() && !filePreview)
                    }
                  >
                    {createMessageLoading || filePreview?.uploading ? (
                      <svg
                        className="h-4 w-4 animate-spin"
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
                    ) : (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="flex items-center justify-center">
            <CardContent className="text-center py-12">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-lg font-semibold mb-2">No conversation selected</h3>
              <p className="text-muted-foreground">
                Select a conversation from the left to start messaging
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
