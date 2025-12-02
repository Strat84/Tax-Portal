import { useState, useEffect } from 'react'
import { getDocuments, Document } from '@/lib/api/documents'

export function useDocuments(userId: string | null) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await getDocuments(userId)
      setDocuments(data)
    } catch (err: any) {
      console.error('Error in useDocuments:', err)
      setError(err.message || 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [userId])

  return {
    documents,
    loading,
    error,
    refetch: fetchDocuments,
  }
}
