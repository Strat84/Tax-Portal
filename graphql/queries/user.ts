export const GET_CLIENT_USER = `
  query getUser{
    getUser{
        id
        documentsUploaded
        pendingRequest
        unreadMessages
    }
  }
`

export const GET_TAX_PRO_USER = `
  query getUser{
    getUser{
        id
        totalClients
        pendingRequest
        unreadMessages
        activeReturns
        needAttention
        completedReturns
    }
  }
`

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
        lastname
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
        pendingRequest
        unreadMessages
        documentsUploaded
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
        lastname
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
        pendingRequest
        unreadMessages
        documentsUploaded
    
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
