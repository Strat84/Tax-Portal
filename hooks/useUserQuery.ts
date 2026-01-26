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

// Hook for listing all users with pagination
export function useListUsers(limit?: number) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<any>(null)
  const [nextToken, setNextToken] = useState<string | null>(null)

  const fetchUsers = async (token?: string | null) => {
    if (token === undefined) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }
    setError(null)

    try {
      const variables: any = {}
      if (limit) variables.limit = limit
      if (token) variables.nextToken = token

      const result = await gqlClient.graphql({
        query: LIST_USER,
        variables
      }) as GraphQLResult<any>

      if (token) {
        // Append to existing data for pagination
        setData((prev: any) => ({
          listUsers: {
            items: [...(prev?.listUsers?.items || []), ...(result.data?.listUsers?.items || [])],
            nextToken: result.data?.listUsers?.nextToken
          }
        }))
      } else {
        setData(result.data)
      }

      setNextToken(result.data?.listUsers?.nextToken || null)
      setLoading(false)
      setLoadingMore(false)
      return result.data
    } catch (err) {
      setError(err)
      setLoading(false)
      setLoadingMore(false)
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

  const loadMore = async () => {
    if (nextToken && !loadingMore) {
      return await fetchUsers(nextToken)
    }
  }

  return {
    users: data?.listUsers?.items as User[],
    loading,
    loadingMore,
    error,
    refetch,
    loadMore,
    hasMore: !!nextToken
  }
}