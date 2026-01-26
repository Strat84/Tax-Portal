export const LIST_NOTIFICATION = `
query listNotifications( $limit: Int, $nextToken: String){
  listNotifications(limit: $limit, nextToken: $nextToken) {
    count
    nextToken
    items {
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
}
`

