
export const UPDATE_USER_PROFILE = `
  mutation updateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
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
    }
  }
`