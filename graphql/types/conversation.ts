import { User, UserStatus } from './users'


export interface Conversation {
  PK: string
  SK: string
  conversationId: string
  createdAt: string
  lastMessage?: string
  lastMessageAt?: string
  unreadCount: number
  updatedAt: string
  user1Id: string
  user2Id: string
  user1: User
  user2: User
}

export interface GetConversationsResponse {
  getConversations: Conversation[]
}
