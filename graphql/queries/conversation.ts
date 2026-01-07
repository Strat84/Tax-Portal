
export const GET_CONVERSATIONS = `
  query getConversations {
    getConversations(limit: 10) {
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
      user2 {
        email
        id
        isActive
        lastActiveAt
        lastLogin
        name
        phone
        role
        status
      }
      user1 {
        email
        status
        name
        role
        phone
        lastLogin
        lastActiveAt
        isActive
        id
      }
    }
  }
`;
