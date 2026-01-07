import { User } from './users'

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
