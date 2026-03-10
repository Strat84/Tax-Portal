'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import useConversations from '@/hooks/useConversations'
import useCurrentUser from '@/hooks/useUserQuery'
import { useConversationMessages, useCreateMessage } from '@/hooks/useMessages'
import { FilePreview, MessageType } from '@/graphql/types/message'
import { uploadFileToS3, isImageFile, UploadProgress } from '@/lib/storage/fileUpload'
import { v4 as uuidv4 } from 'uuid'
import ConversationSidebar from '@/components/messages/ConversationSidebar'
import ConversationHeader from '@/components/messages/ConversationHeader'
import MessageList from '@/components/messages/MessageList'
import MessageInputArea from '@/components/messages/MessageInputArea'

export default function ClientMessagesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
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

  const selectedConv = conversations.find(c => c.id === selectedConversation)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground mt-2">
          Communicate with your tax professional
        </p>
      </div>

      {/* Messages Interface */}
      <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
        {/* Conversations Sidebar */}
        <ConversationSidebar
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelectConversation={handleConversationClick}
          loading={conversationsLoading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Message Thread */}
        {selectedConv ? (
          <Card className="flex flex-col h-[calc(100vh-280px)]">
            <ConversationHeader
              name={selectedConv.taxProName}
              status={selectedConv.status}
            />

            <MessageList
              messages={messages}
              loading={messagesLoading}
              isLoadingMore={isLoadingMore}
              containerRef={messagesContainerRef}
              onScroll={handleScroll}
            />

            <MessageInputArea
              message={newMessage}
              onMessageChange={setNewMessage}
              onKeyDown={handleKeyPress}
              filePreview={filePreview}
              onFileSelect={handleFileSelect}
              onRemoveFile={handleRemoveFile}
              onSend={handleSendMessage}
              loading={createMessageLoading}
            />
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
