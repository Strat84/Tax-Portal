import { User } from './users'

export type SeenStatus = 'SEEN' | 'UNSEEN'

export interface Message {
  PK: string
  SK: string
  content: string
  conversationId: string
  createdAt: string
  GSI1PK: string
  GSI1SK: string
  messageId: string
  messageType: string
  receiverId: string
  senderId: string
  timestamp: string
  updatedAt: string
  sender: User
  receiver: User
  isSeenStatus: SeenStatus
}

export interface GetMessagesResponse {
  getMessages: {
    items: Message[]
    nextToken: string | null
  }
}
