export const REQUEST_DOCUMENT = `
mutation createDocumentRequest($input: CreateDocumentRequestInput!) {
  createDocumentRequest(
    input: $input
  ) {
    PK
    SK
    clientId
    createdAt
    clientNotes
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
      unreadMessages
      updatedAt
    }
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
  }
}
`


export const UPDATE_DOCUMENT_REQUEST = `
mutation updateDocumentRequest($input: UpdateDocumentRequestInput!) {
  updateDocumentRequest(input: $input) {
    PK
    SK
    clientId
    createdAt
    clientNotes
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
      unreadMessages
      updatedAt
    }
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
  }
}
`


