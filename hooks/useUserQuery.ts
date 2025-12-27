'use client'

import { useQuery, useMutation } from '@apollo/client'
import { GET_CURRENT_USER, UPDATE_USER_PROFILE } from '@/graphql/queries/user'
import { User } from '@/graphql/types/users'

// Hook for getting current user
export default function useCurrentUser() {
  const { data, loading, error, refetch } = useQuery(GET_CURRENT_USER, {
    fetchPolicy: 'cache-and-network', // Fresh data ke liye
    onError: (error) => {
      console.error('Error fetching current user:', error)
    }
  })

  return {
    user: data?.getUser as User,
    loading,
    error,
    refetch
  }
}

export function useUpdateUserProfile() {
  const [updateUserProfileMutation, { data, loading, error }] = useMutation(UPDATE_USER_PROFILE, {
    onError: (error) => {
      console.error('Error updating user profile:', error)
    }
  })

  const updateProfile = async (input: {
    name?: string
    phone?: string
    profile?: Record<string, any>
  }) => {
    try {
      const result = await updateUserProfileMutation({
        variables: { input },
        update: (cache, { data }) => {
          if (data?.updateUser) {
            try {
              cache.writeQuery({
                query: GET_CURRENT_USER,
                data: { getUser: data.updateUser }
              })
            } catch (err) {
              // ignore cache write errors
              console.warn('Cache write failed for updateUserProfile', err)
            }
          }
        }
      })

      return result.data?.updateUser
    } catch (err) {
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