export const UPDATE_CONVERSATION = `
  mutation updateConversation($input: UpdateConversationInput!) {
    updateConversation(input: $input) {
      PK
      SK
      conversationId
      createdAt
      lastMessage
      lastMessageAt
      unreadCount
      updatedAt
      user1Id
      user2Id
      user1 {
        email
        isActive
        id
        name
        phone
        role
        status
        updatedAt
        createdAt
        lastActiveAt
        lastLogin
      }
      user2 {
        createdAt
        email
        id
        isActive
        lastActiveAt
        lastLogin
        name
        phone
        role
        status
        updatedAt
      }
    }
  }
`
