export type NotificationType = 'new_message' | 'reply' | 'urgent' | 'system'
export type MessageAttachmentType = 'document' | 'image' | 'file' | 'attachment'
export type UserStatus = 'online' | 'offline' | 'away'
export type PriorityLevel = 'normal' | 'starred' | 'urgent' | 'pending_response'

export interface NotificationUser {
  id: string
  name: string
  email: string
  avatar?: string
  status: UserStatus
  isStarred?: boolean
}

export interface NotificationMessage {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  senderEmail: string
  content: string
  createdAt: string
  isRead: boolean
  attachmentType?: MessageAttachmentType
  deliveryStatus: 'sent' | 'delivered' | 'read'
  priority: PriorityLevel
  isTyping?: boolean
}

export interface MessageNotification {
  id: string
  conversationId: string
  user: NotificationUser
  lastMessage: NotificationMessage
  unreadCount: number
  timestamp: string
  type: NotificationType
  isPinned?: boolean
  hasUnresolvedQuery?: boolean
}

export interface NotificationStats {
  totalUnread: number
  newMessages: number
  replies: number
  urgent: number
  system: number
}
