'use client'

import { useMutation, useSubscription } from '@apollo/client'
import { UPDATE_USER_PROFILE, SUBSCRIBE_USER_STATUS, GET_CURRENT_USER } from '@/graphql/queries/user'
import { UserStatus } from '@/graphql/types/users'

/**
 * Hook for GraphQL integration of user status
 * Syncs user status with backend and subscribes to real-time updates
 */
export default function useUserStatus(userId?: string) {
  // Mutation to update user status
  const [updateUserMutation, { loading, error }] = useMutation(UPDATE_USER_PROFILE, {
    onError: (error) => {
      console.error('Error updating user status:', error)
    }
  })

  // Function to update status
  const updateUserStatus = async (status: UserStatus, additionalFields?: { isActive?: boolean }) => {
    if (!userId) {
      console.warn('Cannot update status: userId is undefined')
      return
    }

    try {
      const result = await updateUserMutation({
        variables: {
          input: {
            status,
            lastActiveAt: new Date().toISOString(),
            ...(additionalFields?.isActive !== undefined && { isActive: additionalFields.isActive })
          }
        },
        update: (cache, { data }) => {
          if (data?.updateUser) {
            try {
              // Update cache with new user data
              cache.writeQuery({
                query: GET_CURRENT_USER,
                data: { getUser: data.updateUser }
              })
            } catch (err) {
              console.warn('Cache write failed for updateUserStatus', err)
            }
          }
        }
      })

      return result.data?.updateUser
    } catch (err) {
      throw err
    }
  }

  // Subscribe to status changes for this user
  const { data: subscriptionData } = useSubscription(SUBSCRIBE_USER_STATUS, {
    variables: { id: userId },
    skip: !userId, // Skip subscription if no userId
    onError: (error) => {
      console.error('Subscription error:', error)
    }
  })

  return {
    updateUserStatus,
    loading,
    error,
    subscriptionData: subscriptionData?.onUpdateUser
  }
}
