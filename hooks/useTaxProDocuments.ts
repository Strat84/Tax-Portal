// NOTE: This hook is currently not in use.
// The tax-pro documents page has been removed from the navigation.
// Tax professionals now view documents only through individual client detail pages.
// This hook is preserved for potential future use when API integration is implemented.

import { useState, useEffect } from 'react'
import { getTaxProDocuments, TaxProDocument } from '@/lib/api/documents'

export function useTaxProDocuments(taxProId: string | null) {
  const [documents, setDocuments] = useState<TaxProDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = async () => {
    if (!taxProId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await getTaxProDocuments(taxProId)
      setDocuments(data)
    } catch (err: any) {
      console.error('Error in useTaxProDocuments:', err)
      setError(err.message || 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [taxProId])

  return {
    documents,
    loading,
    error,
    refetch: fetchDocuments,
  }
}
