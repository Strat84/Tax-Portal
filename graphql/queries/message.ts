
export const GET_MESSAGES = `
  query getMessages($conversationId: ID!, $limit: Int, $nextToken: String) {
    getMessages(conversationId: $conversationId, limit: $limit, nextToken: $nextToken) {
      items {
        PK
        SK
        GSI1PK
        GSI1SK
        content
        conversationId
        createdAt
        isSeenStatus
        attachments {
          id
          name
          size
          type
          url
        }
        messageId
        messageType
        receiverId
        senderId
        timestamp
        updatedAt
        sender {
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
        receiver {
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
      nextToken
    }
  }
`