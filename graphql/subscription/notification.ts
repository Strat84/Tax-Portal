export const ON_NEW_NOTIFICATION = `
    subscription onNewNotification($userId: ID!)  {
        onNewNotification(userId: $userId) {
            PK
            SK
            createdAt
            conversationId
            description
            fullPath
            isSeenStatus
            notificationId
            updatedAt
            userId
            type
            title
        }
    }
`