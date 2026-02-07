'use client'

import { gqlClient } from '@/lib/appsync/client'
import { GET_FOLDER, SEARCH_FILE } from '@/graphql/queries/file'
import { CREATE_FILE, DELETE_FILE, UPDATE_FILE } from '@/graphql/mutation/file'
import { GraphQLResult } from '@aws-amplify/api-graphql'
import { useState, useCallback } from 'react'

function normalizeParentPath(parentPath?: string | null) {
  const raw = (parentPath ?? '/').trim()
  const cleaned = raw.replace(/^\/+|\/+$/g, '')
  if (cleaned === '') return '/'
  return `/${cleaned}/`
}

interface FileItem {
  PK: string
  SK: string
  type: 'FOLDER' | 'FILE' | 'IMAGE'
  name: string
  parentPath: string
  fullPath: string
  size?: number
  mimeType?: string
  fileType?: string
  s3Key?: string
  createdAt: string
  updatedAt: string
  isDeleted: boolean
  documentRequestId?: string
  documentRequestPK?: string
  documentRequestSK?: string
}

interface GetFolderResponse {
  getFolder: {
    items: FileItem[]
    count: number
    nextToken?: string
  }
}

interface CreateFileResponse {
  createFile: FileItem
}

interface DeleteFileResponse {
  deleteFile: FileItem
}

interface UpdateFileResponse {
  updateFile: FileItem
}

interface SearchFilesResponse {
  searchFiles: {
    items: FileItem[]
    count: number
    nextToken?: string
  }
}

// Hook for fetching files/folders
export function useFetchFiles() {
  const [data, setData] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)

  const fetchFiles = useCallback(async (parentPath: string = '/', userId?: string, limit: number = 50) => {
    setLoading(true)
    setError(null)

    try {
      const normalizedParentPath = normalizeParentPath(parentPath)
      const result = await gqlClient.graphql({
        query: GET_FOLDER,
        variables: {
          parentPath: normalizedParentPath,
          userId,
          limit
        }
      }) as GraphQLResult<GetFolderResponse>

      const items = result.data?.getFolder?.items || []
      setData(items)
      setLoading(false)
      return items
    } catch (err) {
      console.error('Failed to fetch files:', err)
      setError(err)
      setLoading(false)
      throw err
    }
  }, [])


  return {
    files: data,
    loading,
    error,
    fetchFiles
  }
}

// Hook for searching files/folders
export function useSearchFiles() {
  const [data, setData] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)

  const searchFiles = useCallback(async (searchTerm: string, userId?: string, limit: number = 50) => {
    if (!searchTerm || searchTerm.trim() === '') {
      setData([])
      setLoading(false)
      return []
    }

    setLoading(true)
    setError(null)

    try {
      const result = await gqlClient.graphql({
        query: SEARCH_FILE,
        variables: {
          searchTerm: searchTerm.trim(),
          userId,
          limit
        }
      }) as GraphQLResult<SearchFilesResponse>

      const items = result.data?.searchFiles?.items || []
      setData(items)
      setLoading(false)
      return items
    } catch (err) {
      console.error('Failed to search files:', err)
      setError(err)
      setLoading(false)
      throw err
    }
  }, [])

  return {
    files: data,
    loading,
    error,
    searchFiles
  }
}

// Hook for creating folder
export function useCreateFolder() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)

  const createFolder = async (
    name: string,
    parentPath: string,
    fullPath: string
  ) => {
    setLoading(true)
    setError(null)

    try {
      const normalizedParentPath = normalizeParentPath(parentPath)
      const result = await gqlClient.graphql({
        query: CREATE_FILE,
        variables: {
          input: {
            type: 'FOLDER',
            name,
            parentPath: normalizedParentPath,
            fullPath,
            s3Key: fullPath, // Store S3 path as s3Key for folders
          }
        }
      }) as GraphQLResult<CreateFileResponse>

      setLoading(false)
      return result.data?.createFile
    } catch (err) {
      console.error('Failed to create folder:', err)
      setError(err)
      setLoading(false)
      throw err
    }
  }

  return {
    createFolder,
    loading,
    error
  }
}

// Hook for creating file
export function useCreateFile() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)

  const createFile = async (input: {
    type: 'FILE' | 'IMAGE'
    name: string
    fileType?: string
    s3Key: string
    parentPath: string
    fullPath: string
    size: number
    mimeType: string
  }) => {
    setLoading(true)
    setError(null)

    try {
      const normalizedParentPath = normalizeParentPath(input.parentPath)
      const result = await gqlClient.graphql({
        query: CREATE_FILE,
        variables: {
          input: {
            ...input,
            parentPath: normalizedParentPath,
          }
        }
      }) as GraphQLResult<CreateFileResponse>

      setLoading(false)
      return result.data?.createFile
    } catch (err) {
      console.error('Failed to create file:', err)
      setError(err)
      setLoading(false)
      throw err
    }
  }

  return {
    createFile,
    loading,
    error
  }
}

// Hook for deleting file/folder
export function useDeleteFile() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)

  const deleteFile = useCallback(async (fullPath: string) => {
    setLoading(true)
    setError(null)

    try {
      const result = await gqlClient.graphql({
        query: DELETE_FILE,
        variables: {
          fullPath
        }
      }) as GraphQLResult<DeleteFileResponse>

      setLoading(false)
      return result.data?.deleteFile
    } catch (err) {
      console.error('Failed to delete file:', err)
      setError(err)
      setLoading(false)
      throw err
    }
  }, [])

  return {
    deleteFile,
    loading,
    error
  }
}

// Hook for updating file/folder
export function useUpdateFile() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)

  const updateFile = useCallback(async (input: {
    fullPath: string
    name: string
  }) => {
    setLoading(true)
    setError(null)

    try {
      const result = await gqlClient.graphql({
        query: UPDATE_FILE,
        variables: {
          input
        }
      }) as GraphQLResult<UpdateFileResponse>

      setLoading(false)
      return result.data?.updateFile
    } catch (err) {
      console.error('Failed to update file:', err)
      setError(err)
      setLoading(false)
      throw err
    }
  }, [])

  return {
    updateFile,
    loading,
    error
  }
}
