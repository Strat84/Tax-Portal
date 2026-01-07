
export const CREATE_MESSAGE = `
  mutation createMessage($input: CreateMessageInput!) {
    createMessage(input: $input) {
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
      timestamp
      updatedAt
      isSeenStatus
      attachments {
        id
        name
        size
        type
        url
      }
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
`
