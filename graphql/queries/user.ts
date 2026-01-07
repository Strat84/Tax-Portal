
export const GET_CURRENT_USER = `
  query getUser {
    getUser {
        createdAt
        email
        id
        isActive
        lastLogin
        lastActiveAt
        name
        phone
        role
        status
        updatedAt
    }
  }
`

export const UPDATE_USER_PROFILE = `
  mutation updateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
      createdAt
      email
      id
      isActive
      lastLogin
      lastActiveAt
      name
      phone
      role
      status
      updatedAt
    }
  }
`

export const LIST_USER = `
  query listUsers {
    listUsers{
      items {
        updatedAt
        status
        role
        phone
        name
        lastActiveAt
        lastLogin
        isActive
        id
        email
        createdAt
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
