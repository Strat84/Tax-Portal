
export const ON_NEW_MESSAGE = `
  subscription OnNewMessage($conversationId: ID!) {
    onNewMessage(conversationId: $conversationId) {
        PK
        SK
        GSI1PK
        GSI1SK
        content
        conversationId
        createdAt
        messageId
        messageType
        receiverId
        senderId
        isSeenStatus
        attachments {
          id
          name
          size
          type
          url
        }
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
      }
  `;