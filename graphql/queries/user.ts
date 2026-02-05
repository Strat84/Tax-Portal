
export const GET_CURRENT_USER = `
  query getUser {
    getUser {
        updatedAt
        unreadMessages
        taxReturnStatus
        status
        ssn
        phone
        role
        pendingRequest
        name
        lastLogin
        lastActiveAt
        isActive
        id
        email
        documentsUploaded
        createdAt
        address
        taxYear
        filingStatus
        numberOfDependents
    }
  }
`


export const LIST_USER = `
  query listUsers($limit: Int, $nextToken: String){
    listUsers(limit: $limit, nextToken: $nextToken){
      items {
        updatedAt
        unreadMessages
        taxReturnStatus
        status
        ssn
        phone
        role
        pendingRequest
        name
        lastLogin
        lastActiveAt
        isActive
        id
        email
        documentsUploaded
        createdAt
        address 
        taxYear
        filingStatus
        numberOfDependents
      }
      nextToken
    }
  }
`

export const SUBSCRIBE_USER_STATUS = `
  subscription onUpdateUser($id: ID!) {
    onUpdateUser(id: $id) {
      id
      status
      lastActiveAt
      updatedAt
    }
  }
`
