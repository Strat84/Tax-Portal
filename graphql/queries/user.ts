import { gql } from '@apollo/client'

export const GET_CURRENT_USER = gql`
  query getUser {
    getUser {
        createdAt
        email
        id
        isActive
        lastLogin
        name
        phone
        role
        updatedAt
    }
  }
`

export const UPDATE_USER_PROFILE = gql`
  mutation updateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
      createdAt
      email
      id
      isActive
      lastLogin
      name
      phone
      role
      updatedAt
    }
  }
`

