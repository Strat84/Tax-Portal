'use client'

import { gqlClient } from '@/lib/appsync/client'
import { GET_CURRENT_USER, UPDATE_USER_PROFILE, LIST_USER } from '@/graphql/queries/user'
import { User, GetUserResponse, UpdateUserResponse } from '@/graphql/types/users'
import { GraphQLResult } from '@aws-amplify/api-graphql'
import { useEffect, useState } from 'react'

// Hook for getting current user
export default function useCurrentUser() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  const fetchUser = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await gqlClient.graphql({
        query: GET_CURRENT_USER
      }) as GraphQLResult<GetUserResponse>
      setData(result.data)
      setLoading(false)
      return result.data
    } catch (err) {
      setError(err)
      setLoading(false)
      throw err
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchUser()
  }, [])

  const refetch = async () => {
    return await fetchUser()
  }

  return {
    user: data?.getUser as User,
    loading,
    error,
    refetch
  }
}

export function useUpdateUserProfile() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)

  const updateProfile = async (input: {
    name?: string
    phone?: string
    profile?: Record<string, any>
  }) => {
    setLoading(true)
    setError(null)

    try {
      const result = await gqlClient.graphql({
        query: UPDATE_USER_PROFILE,
        variables: { input }
      }) as GraphQLResult<UpdateUserResponse>

      setData(result.data)
      setLoading(false)
      return result.data?.updateUser
    } catch (err) {
      setError(err)
      setLoading(false)
      throw err
    }
  }

  return {
    updateProfile,
    loading,
    error,
    data: data?.updateUser
  }
}

// Hook for listing all users
export function useListUsers() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await gqlClient.graphql({
        query: LIST_USER
      }) as GraphQLResult<any>
      setData(result.data)
      setLoading(false)
      return result.data
    } catch (err) {
      setError(err)
      setLoading(false)
      throw err
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchUsers()
  }, [])

  const refetch = async () => {
    return await fetchUsers()
  }

  return {
    users: data?.listUsers?.items as User[],
    loading,
    error,
    refetch
  }
}