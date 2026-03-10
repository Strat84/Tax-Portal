import { User } from './users'
import { UserStatus } from './users'
import { Ref } from 'react'

export type SeenStatus = 'SEEN' | 'UNSEEN'
export type MessageType = 'TEXT' | 'FILE' | 'IMAGE'

export interface Attachment {
  id?: string
  name: string
  type: string
  url: string
  size?: number
}

export interface Message {
  PK: string
  SK: string
  content: string
  conversationId: string
  createdAt: string
  GSI1PK: string
  GSI1SK: string
  messageId: string
  messageType: MessageType
  receiverId: string
  senderId: string
  timestamp: string
  updatedAt: string
  sender: User
  receiver: User
  isSeenStatus: SeenStatus
  attachments?: Attachment[]
}

export interface GetMessagesResponse {
  getMessages: {
    items: Message[]
    nextToken: string | null
  }
}

export interface CreateMessageResponse {
  createMessage: Message
}

// Conversation Types
export interface Conversation {
  id: string
  taxProName: string
  taxProInitials: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  isActive: boolean
  status: UserStatus | undefined
}

// UI Message Type
export interface UIMessage {
  id: string
  senderId: string
  senderName: string
  content: string
  timestamp: string
  isFromCurrentUser: boolean
  messageType: string
  attachments?: Attachment[]
}

// Component Props Types
export interface ConversationSidebarProps {
  conversations: Conversation[]
  selectedConversation: string | null
  onSelectConversation: (conversationId: string) => void
  loading: boolean
  searchQuery: string
  onSearchChange: (query: string) => void
}

export interface ConversationHeaderProps {
  name: string
  status: UserStatus | undefined
}

export interface MessageListProps {
  messages: UIMessage[]
  loading: boolean
  isLoadingMore: boolean
  containerRef: Ref<HTMLDivElement>
  onScroll: () => void
}

export interface MessageInputAreaProps {
  message: string
  onMessageChange: (message: string) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  filePreview: FilePreview | null
  onFileSelect: (file: File) => void
  onRemoveFile: () => void
  onSend: () => void
  loading: boolean
}

export interface FilePreview {
  file: File
  preview?: string
  uploading: boolean
  progress: number
  error?: string
}
