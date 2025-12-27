'use client'

import { ApolloClient, InMemoryCache, ApolloLink } from '@apollo/client'
import { HttpLink } from '@apollo/client/link/http'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'

const cache = new InMemoryCache()

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_API_URL,
})

const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, path }) => {
      console.error(`[GraphQL error]: ${message}, Path: ${path}`)
    })
  }
  
  if (networkError) {
    console.error(`[Network error]: ${networkError.message}`)
    
    const statusCode = (networkError as any).statusCode
    if (statusCode === 401) {
      console.log('Login required!')
      
      // Clear cache on 401 to prevent using stale auth data
      cache.reset()
      
      // Clear the idToken cookie
      if (typeof document !== 'undefined') {
        document.cookie = 'idToken=; path=/; max-age=0'
      }
      
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
  }
})

const authLink = setContext(async (_, { headers }) => {
  if (typeof window !== 'undefined' && (window as any).DEMO_MODE) {
    return {
      headers: {
        ...headers,
        authorization: 'Bearer ',
      }
    }
  }
  
  // Real auth - AWS Cognito
  try {
    const { fetchAuthSession } = await import('aws-amplify/auth')
    const session = await fetchAuthSession()
    console.log("session ::", session)
    const token = session.tokens?.idToken?.toString()
    
    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : '',
      }
    }
  } catch (error) {
    console.log('No auth token available')
    return { headers }
  }
})

// Combine links
const link = ApolloLink.from([errorLink, authLink, httpLink])

// Create Apollo Client
export const client = new ApolloClient({
  link,
  cache,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-first',
    },
    query: {
      fetchPolicy: 'network-only',
    },
  },
})