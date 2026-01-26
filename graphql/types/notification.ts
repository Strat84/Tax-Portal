export type NotificationSeenStatus = 'SEEN' | 'UNSEEN'
export type NotificationType = 'MESSAGE' | 'FILE' | 'SYSTEM'

export interface NotificationItem {
  PK: string
  SK: string
  notificationId: string
  userId: string
  type: NotificationType
  title: string
  description: string
  isSeenStatus: NotificationSeenStatus
  conversationId?: string
  fullPath?: string
  createdAt: string
  updatedAt?: string
}

export interface ListNotificationsResponse {
  listNotifications: {
    items: NotificationItem[]
    count: number
    nextToken?: string
  }
}

export interface UpdateNotificationInput {
  PK: string
  SK: string
  isSeenStatus: NotificationSeenStatus
}

export interface UpdateNotificationResponse {
  updateNotification: NotificationItem
}

export interface OnNewNotificationResponse {
  onNewNotification: NotificationItem
}
