import { useState, useEffect } from 'react'
import { getClientRequests, getTaxProRequests, DocumentRequest } from '@/lib/api/requests'

export function useClientRequests(clientId: string | null) {
  const [requests, setRequests] = useState<DocumentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRequests = async () => {
    if (!clientId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await getClientRequests(clientId)
      setRequests(data)
    } catch (err: any) {
      console.error('Error in useClientRequests:', err)
      setError(err.message || 'Failed to load document requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [clientId])

  return {
    requests,
    loading,
    error,
    refetch: fetchRequests,
  }
}

export function useTaxProRequests(taxProId: string | null) {
  const [requests, setRequests] = useState<DocumentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRequests = async () => {
    if (!taxProId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await getTaxProRequests(taxProId)
      setRequests(data)
    } catch (err: any) {
      console.error('Error in useTaxProRequests:', err)
      setError(err.message || 'Failed to load document requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [taxProId])

  return {
    requests,
    loading,
    error,
    refetch: fetchRequests,
  }
}
