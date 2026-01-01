import { gql } from '@apollo/client'

export const GET_CURRENT_USER = gql`
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

export const UPDATE_USER_PROFILE = gql`
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

export const SUBSCRIBE_USER_STATUS = gql`
  subscription onUpdateUser($id: ID!) {
    onUpdateUser(id: $id) {
      id
      status
      lastActiveAt
      updatedAt
    }
  }
`
