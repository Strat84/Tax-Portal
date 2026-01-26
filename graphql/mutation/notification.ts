export const UPDATE_NOTIFICATION = `
mutation updateNotification($input: UpdateNotificationInput!){
  updateNotification(
    input: $input
  ) {
    PK
    SK
    conversationId
    createdAt
    description
    fullPath
    isSeenStatus
    notificationId
    title
    type
    updatedAt
    userId
  }
}
`