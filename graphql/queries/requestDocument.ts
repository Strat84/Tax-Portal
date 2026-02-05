
export const GET_CLIENT_REQUESTS = `
query getClientRequests($clientId: ID!, $nextToken: String, $limit: Int) {
  getClientRequests(clientId: $clientId, nextToken: $nextToken, limit: $limit) {
    count
    nextToken
    items {
      PK
      SK
      clientId
      clientNotes
      createdAt
      description
      documentRequestId
      documentType
      dueDate
      fulfilledAt
      notes
      priority
      status
      taxProfessionalId
      updatedAt
      clientName {
        address
        createdAt
        documentsUploaded
        email
        id
        isActive
        lastActiveAt
        lastLogin
        name
        pendingRequest
        phone
        role
        ssn
        status
        taxReturnStatus
        unreadMessages
        updatedAt
      }
      taxProName {
        address
        createdAt
        documentsUploaded
        email
        id
        isActive
        lastActiveAt
        lastLogin
        name
        pendingRequest
        phone
        role
        ssn
        status
        taxReturnStatus
        updatedAt
        unreadMessages
      }
    }
  }
}
`


export const GET_TAX_PRO_REQUESTS = `
    query getTaxProRequests($limit: Int, $nextToken: String) {
        getTaxProRequests(limit: $limit, nextToken: $nextToken) {
        count
        nextToken
        items {
            PK
            SK
            clientId
            clientNotes
            createdAt
            description
            documentRequestId
            documentType
            dueDate
            fulfilledAt
            notes
            priority
            status
            taxProfessionalId
            updatedAt
            clientName {
                address
                createdAt
                documentsUploaded
                email
                id
                isActive
                lastActiveAt
                lastLogin
                name
                pendingRequest
                phone
                role
                ssn
                status
                taxReturnStatus
                unreadMessages
                updatedAt
            }
            taxProName {
                address
                createdAt
                documentsUploaded
                email
                id
                isActive
                lastActiveAt
                lastLogin
                name
                pendingRequest
                phone
                role
                ssn
                status
                taxReturnStatus
                updatedAt
                unreadMessages
            }
        }
    }
}
`