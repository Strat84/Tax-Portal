import { createClient } from '@/lib/db/supabase'

export interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  createdAt: string
  isRead: boolean
  // Populated fields
  senderName?: string
  senderRole?: string
}

export interface Conversation {
  id: string
  clientUserId: string
  taxProUserId: string
  lastMessageAt: string
  createdAt: string
  // Populated fields
  clientName?: string
  taxProName?: string
  lastMessage?: string
  unreadCount?: number
}

export async function getConversations(userId: string, userRole: string): Promise<Conversation[]> {
  const supabase = createClient()

  let query = supabase
    .from('conversations')
    .select(`
      *,
      client_users:users!conversations_client_user_id_fkey(name),
      tax_pro_users:users!conversations_tax_pro_user_id_fkey(name),
      messages(content, created_at)
    `)
    .order('last_message_at', { ascending: false })

  // Filter based on role
  if (userRole === 'client') {
    query = query.eq('client_user_id', userId)
  } else if (userRole === 'tax_pro') {
    query = query.eq('tax_pro_user_id', userId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching conversations:', error)
    throw new Error('Failed to fetch conversations')
  }

  return data.map(conv => {
    const lastMessage = conv.messages?.[0]

    return {
      id: conv.id,
      clientUserId: conv.client_user_id,
      taxProUserId: conv.tax_pro_user_id,
      lastMessageAt: conv.last_message_at,
      createdAt: conv.created_at,
      clientName: conv.client_users?.name,
      taxProName: conv.tax_pro_users?.name,
      lastMessage: lastMessage?.content,
      unreadCount: 0, // TODO: Calculate unread count
    }
  })
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:users!messages_sender_id_fkey(name, role)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching messages:', error)
    throw new Error('Failed to fetch messages')
  }

  return data.map(msg => ({
    id: msg.id,
    conversationId: msg.conversation_id,
    senderId: msg.sender_id,
    content: msg.content,
    createdAt: msg.created_at,
    isRead: msg.is_read,
    senderName: msg.sender?.name,
    senderRole: msg.sender?.role,
  }))
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string
): Promise<Message> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content: content,
      is_read: false,
    })
    .select()
    .single()

  if (error) {
    console.error('Error sending message:', error)
    throw new Error('Failed to send message')
  }

  // Update conversation last_message_at
  await supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId)

  return {
    id: data.id,
    conversationId: data.conversation_id,
    senderId: data.sender_id,
    content: data.content,
    createdAt: data.created_at,
    isRead: data.is_read,
  }
}

export async function markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .eq('is_read', false)

  if (error) {
    console.error('Error marking messages as read:', error)
    throw new Error('Failed to mark messages as read')
  }
}

export async function createConversation(
  clientUserId: string,
  taxProUserId: string
): Promise<Conversation> {
  const supabase = createClient()

  // Check if conversation already exists
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('client_user_id', clientUserId)
    .eq('tax_pro_user_id', taxProUserId)
    .single()

  if (existing) {
    return {
      id: existing.id,
      clientUserId: existing.client_user_id,
      taxProUserId: existing.tax_pro_user_id,
      lastMessageAt: existing.last_message_at,
      createdAt: existing.created_at,
    }
  }

  // Create new conversation
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      client_user_id: clientUserId,
      tax_pro_user_id: taxProUserId,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating conversation:', error)
    throw new Error('Failed to create conversation')
  }

  return {
    id: data.id,
    clientUserId: data.client_user_id,
    taxProUserId: data.tax_pro_user_id,
    lastMessageAt: data.last_message_at,
    createdAt: data.created_at,
  }
}
