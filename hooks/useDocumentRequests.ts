'use client'

import { gqlClient } from '@/lib/appsync/client'
import { GET_CLIENT_REQUESTS, GET_TAX_PRO_REQUESTS } from '@/graphql/queries/requestDocument'
import { REQUEST_DOCUMENT, UPDATE_DOCUMENT_REQUEST } from '@/graphql/mutation/requestDocument'
import { GraphQLResult } from '@aws-amplify/api-graphql'
import { useState, useCallback } from 'react'

interface DocumentRequest {
  PK: string
  SK: string
  clientId: string
  clientNotes?: string
  createdAt: string
  description: string
  documentRequestId: string
  documentType: string
  dueDate: string
  fulfilledAt?: string
  notes?: string
  priority: string
  status: string
  taxProfessionalId?: string
  updatedAt: string
  clientName?: {
    address?: string
    createdAt: string
    documentsUploaded?: number
    email: string
    id: string
    isActive: boolean
    lastActiveAt?: string
    lastLogin?: string
    name: string
    pendingRequest?: number
    phone?: string
    role: string
    ssn?: string
    status?: string
    taxReturnStatus?: string
    unreadMessages?: number
    updatedAt: string
  }
  taxProName?: {
    address?: string
    createdAt: string
    documentsUploaded?: number
    email: string
    id: string
    isActive: boolean
    lastActiveAt?: string
    lastLogin?: string
    name: string
    pendingRequest?: number
    phone?: string
    role: string
    ssn?: string
    status?: string
    taxReturnStatus?: string
    updatedAt: string
    unreadMessages?: number
  }
}

interface GetRequestsResponse {
  getClientRequests?: {
    count: number
    nextToken?: string
    items: DocumentRequest[]
  }
  getTaxProRequests?: {
    count: number
    nextToken?: string
    items: DocumentRequest[]
  }
}

interface CreateRequestResponse {
  createDocumentRequest: DocumentRequest
}

interface UpdateRequestResponse {
  updateDocumentRequest: DocumentRequest
}

// Hook for fetching client requests
export function useFetchClientRequests() {
  const [data, setData] = useState<DocumentRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)

  const fetchRequests = useCallback(async (clientId: string, limit?: number, nextToken?: string) => {
    setLoading(true)
    setError(null)

    try {
      const result = await gqlClient.graphql({
        query: GET_CLIENT_REQUESTS,
        variables: {
          clientId,
          limit,
          nextToken
        }
      }) as GraphQLResult<GetRequestsResponse>

      setData(result.data?.getClientRequests?.items || [])
      setLoading(false)
      return result.data?.getClientRequests?.items || []
    } catch (err) {
      setError(err)
      setLoading(false)
      throw err
    }
  }, [])

  return {
    requests: data,
    loading,
    error,
    fetchRequests
  }
}

// Hook for fetching tax pro requests
export function useFetchTaxProRequests() {
  const [data, setData] = useState<DocumentRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)

  const fetchRequests = useCallback(async (limit?: number, nextToken?: string) => {
    setLoading(true)
    setError(null)

    try {
      const result = await gqlClient.graphql({
        query: GET_TAX_PRO_REQUESTS,
        variables: {
          limit,
          nextToken
        }
      }) as GraphQLResult<GetRequestsResponse>

      setData(result.data?.getTaxProRequests?.items || [])
      setLoading(false)
      return result.data?.getTaxProRequests?.items || []
    } catch (err) {
      setError(err)
      setLoading(false)
      throw err
    }
  }, [])

  return {
    requests: data,
    loading,
    error,
    fetchRequests
  }
}

// Hook for creating document request
export function useCreateDocumentRequest() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)

  const createRequest = useCallback(async (input: {
    clientId: string
    taxProfessionalId?: string
    documentType: string
    description: string
    priority: string
    dueDate: string
    notes?: string
  }) => {
    setLoading(true)
    setError(null)

    try {
      const result = await gqlClient.graphql({
        query: REQUEST_DOCUMENT,
        variables: {
          input
        }
      }) as GraphQLResult<CreateRequestResponse>

      setLoading(false)
      return result.data?.createDocumentRequest
    } catch (err) {
      setError(err)
      setLoading(false)
      throw err
    }
  }, [])

  return {
    createRequest,
    loading,
    error
  }
}

// Hook for updating document request
export function useUpdateDocumentRequest() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)

  const updateRequest = useCallback(async (input: {
    PK: string
    SK: string
    status?: string
    fulfilledAt?: string
    clientNotes?: string
    notes?: string
  }) => {
    setLoading(true)
    setError(null)

    try {
      const result = await gqlClient.graphql({
        query: UPDATE_DOCUMENT_REQUEST,
        variables: {
          input
        }
      }) as GraphQLResult<UpdateRequestResponse>

      setLoading(false)
      return result.data?.updateDocumentRequest
    } catch (err) {
      setError(err)
      setLoading(false)
      throw err
    }
  }, [])

  return {
    updateRequest,
    loading,
    error
  }
}
