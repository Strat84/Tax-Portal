export type NotificationType = 'message' | 'document' | 'system' | 'task'
export type NotificationStatus = 'unread' | 'read'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  description: string
  timestamp: string
  status: NotificationStatus
  icon?: string
  userId?: string // For messages
  userName?: string
  userAvatar?: string
  fileName?: string // For documents
  uploader?: string
  metadata?: {
    conversationId?: string
    documentId?: string
    taskId?: string
  }
}
