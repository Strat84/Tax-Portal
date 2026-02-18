'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FilePreview } from '@/components/files/FilePreview'
import { FileUpload } from '@/components/files/FileUpload'
import { useListUsers } from '@/hooks/useUserQuery'
import { TaxReturnStatus } from '@/graphql/types/users'
import { gqlClient } from '@/lib/appsync/client'
import { UPDATE_USER_PROFILE } from '@/graphql/mutation/user'
import { GraphQLResult } from '@aws-amplify/api-graphql'
import { UpdateUserResponse } from '@/graphql/types/users'
import { useFetchFiles, useCreateFolder, useSearchFiles, useDeleteFile, useUpdateFile } from '@/hooks/useFileQuery'
import { createFolderPath, getFileUrlForPreview } from '@/lib/storage/fileUpload'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/contexts/AuthContext'
import { Textarea } from '@/components/ui/textarea'
import { useCreateDocumentRequest, useFetchClientRequests } from '@/hooks/useDocumentRequests'
import useConversations from '@/hooks/useConversations'
import { useConversationMessages } from '@/hooks/useMessages'

// Hierarchical folder structure
interface FolderItem {
  id: string
  name: string
  type: 'FOLDER' | 'FILE' | 'IMAGE'
  parentId: string | null
  path: string
  fullPath?: string
  size?: number
  uploadedAt?: string
  fileType?: string
  s3Key?: string
  totalFiles?: number
}

interface PageProps {
  id: string
}

// Path normalization helpers
function normalizePath(path: string) {
  const cleaned = path.replace(/^\/+|\/+$/g, '')
  return cleaned === '' ? '/' : `/${cleaned}`
}

function cleanPathForApi(path: string) {
  const normalized = normalizePath(path)
  return normalized === '/' ? '/' : `${normalized}/`
}

export default function ClientDetailPage({ id }: PageProps) {
  const { users, loading: usersLoading, refetch } = useListUsers()
  const { user } = useAuth()

  // Document management state
  const [currentSegments, setCurrentSegments] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<FolderItem | null>(null)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [itemToRename, setItemToRename] = useState<FolderItem | null>(null)
  const [newName, setNewName] = useState('')
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({})
  const fetchingUrlsRef = useRef<Set<string>>(new Set())
  const fileUrlsRef = useRef<Record<string, string>>({})

  // New request dialog state
  const [newRequestDialogOpen, setNewRequestDialogOpen] = useState(false)
  const [requestForm, setRequestForm] = useState({
    documentType: '',
    description: '',
    priority: '',
    dueDate: '',
    notes: ''
  })

  // File query hooks
  const { files: apiFiles, loading: filesLoading, error: filesError, fetchFiles } = useFetchFiles()
  const { files: searchResults, loading: searchLoading, error: searchError, searchFiles } = useSearchFiles()
  const { createFolder, loading: creatingFolder } = useCreateFolder()
  const { deleteFile, loading: deletingFile } = useDeleteFile()
  const { updateFile, loading: updatingFile } = useUpdateFile()

  // Document request hooks
  const { createRequest, loading: creatingRequest, error: createRequestError } = useCreateDocumentRequest()
  const { requests, loading: requestsLoading, error: requestsError, fetchRequests } = useFetchClientRequests()

  // Message hooks
  const { conversations: conversationsData } = useConversations()

  // Find conversation with this client
  const clientConversationId = useMemo(() => {
    if (!conversationsData || !id || !user) return null
    const conversation = conversationsData.find(conv =>
      (conv.user1Id === id && conv.user2Id === user.id) ||
      (conv.user2Id === id && conv.user1Id === user.id)
    )
    return conversation?.conversationId || null
  }, [conversationsData, id, user])

  const { messages: messagesData, loading: messagesLoading } = useConversationMessages({
    conversationId: clientConversationId,
    limit: 5
  })

  // Debug logs
  useEffect(() => {

  }, [id, user, conversationsData, clientConversationId, messagesData, messagesLoading])

  const isSearching = searchQuery.trim().length > 0
  const activeFiles = isSearching ? searchResults : apiFiles
  const activeLoading = isSearching ? searchLoading : filesLoading
  const activeError = isSearching ? searchError : filesError

  // Current path based on segments
  const currentPath = useMemo(() => {
    if (!currentSegments || currentSegments.length === 0) return '/'
    return normalizePath(currentSegments.join('/'))
  }, [currentSegments])

  const currentPathForApi = useMemo(() => cleanPathForApi(currentPath), [currentPath])

  const memoizedFetchFiles = useCallback(
    (path: string) => {
      if (id) {
        fetchFiles(path, id)
      }
    },
    [id, fetchFiles]
  )

  // Search with debounce
  useEffect(() => {
    const q = searchQuery.trim()
    if (q.length === 0) return

    const timeoutId = setTimeout(() => {
      searchFiles(q, id)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, searchFiles, id])

  // Transform API files to FolderItems
  const items: FolderItem[] = useMemo(() => {
    return activeFiles.map((item: any) => {
      const normalizedPath =
        item.parentPath && item.parentPath !== '/'
          ? normalizePath(item.parentPath)
          : '/'

      return {
        id: item.SK.replace('FILE#', '').replace('FOLDER#', ''),
        name: item.name,
        type: item.type,
        parentId: null,
        path: normalizedPath,
        fullPath: item.fullPath,
        size: item.size,
        uploadedAt: item.createdAt,
        fileType: item.mimeType || item.fileType,
        s3Key: item.s3Key,
        totalFiles: item.totalFiles,
      }
    })
  }, [activeFiles])

  // Fetch files when path changes
  useEffect(() => {
    if (!id) return
    if (isSearching) return
    memoizedFetchFiles(currentPathForApi)
  }, [id, isSearching, memoizedFetchFiles, currentPathForApi])

  // Fetch document requests
  useEffect(() => {
    if (id) {
      fetchRequests(id, 5)
    }
  }, [id, fetchRequests])

  // Sync file URL refs
  useEffect(() => {
    fileUrlsRef.current = fileUrls
  }, [fileUrls])

  // Fetch file URLs for preview
  useEffect(() => {
    const fetchFileUrls = async () => {
      const fileItems = items.filter(item => (item.type === 'FILE' || item.type === 'IMAGE') && item.s3Key)

      for (const item of fileItems) {
        if (fileUrlsRef.current[item.id] || fetchingUrlsRef.current.has(item.id) || !item.fullPath) {
          continue
        }

        fetchingUrlsRef.current.add(item.id)
        try {
          const url = await getFileUrlForPreview(item.fullPath)
          setFileUrls(prev => {
            if (!prev[item.id]) {
              return { ...prev, [item.id]: url }
            }
            return prev
          })
        } catch (error) {
          console.error(`Failed to get URL for file ${item.name}:`, error)
        } finally {
          fetchingUrlsRef.current.delete(item.id)
        }
      }
    }

    if (previewOpen && items.length > 0) {
      fetchFileUrls()
    }
  }, [items, previewOpen])

  // Transform messages data for UI - show latest 5 messages
  const messages = useMemo(() => {
    if (!messagesData || !user) return []

    return messagesData.slice(0, 5).map((msg) => {
      const isFromCurrentUser = msg.senderId === user.id
      const sender = msg.sender || msg.receiver

      return {
        id: msg.messageId,
        from: isFromCurrentUser ? 'You' : (sender?.name || 'Unknown'),
        preview: msg.content,
        date: new Date(msg.timestamp).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        unread: msg.isSeenStatus === 'UNSEEN' && !isFromCurrentUser,
      }
    })
  }, [messagesData, user])

  const activity = [
    { id: '1', action: 'Uploaded document', details: 'W2_ABC_Company.pdf', time: '2 hours ago' },
    { id: '2', action: 'Sent message', details: 'Please upload your W-2 forms', time: '1 day ago' },
    { id: '3', action: 'Status updated', details: 'Changed to In Progress', time: '3 days ago' },
    { id: '4', action: 'Document requested', details: '1099-INT form', time: '1 week ago' },
  ]

  // Find client from users list by ID
  const clientData = useMemo(() => {
    return users?.find(user => user.id === id)
  }, [users, id])

  // Format phone number for display
  const formatPhone = (phone?: string) => {
    if (!phone) return 'N/A'
    if (phone.startsWith('+1')) {
      const digits = phone.replace(/\D/g, '').substring(1)
      if (digits.length === 10) {
        return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`
      }
    }
    return phone
  }

  // Format SSN for display
  const formatSSN = (ssn?: string) => {
    if (!ssn) return '***-**-****'
    const digits = ssn.replace(/\D/g, '')
    if (digits.length === 9) {
      return `***-**-${digits.substring(5)}`
    }
    return '***-**-****'
  }

  // Get last activity time
  const getLastActivity = (updatedAt?: string) => {
    if (!updatedAt) return 'N/A'
    const now = new Date()
    const updated = new Date(updatedAt)
    const diffMs = now.getTime() - updated.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays === 1) return '1 day ago'
    return `${diffDays} days ago`
  }

  // Handle tax return status update
  const handleStatusChange = async (newStatus: TaxReturnStatus) => {
    setUpdatingStatus(true)
    try {
      await gqlClient.graphql({
        query: UPDATE_USER_PROFILE,
        variables: {
          input: {
            userId: id,
            taxReturnStatus: newStatus
          }
        }
      }) as GraphQLResult<UpdateUserResponse>

      // Refetch users to update the UI
      await refetch()
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setUpdatingStatus(false)
    }
  }

  // Handle create document request
  const handleCreateRequest = async () => {
    if (!requestForm.documentType || !requestForm.description || !requestForm.priority || !requestForm.dueDate) {
      alert('Please fill in all required fields')
      return
    }

    try {
      await createRequest({
        clientId: id,
        taxProfessionalId: user?.id,
        documentType: requestForm.documentType,
        description: requestForm.description,
        priority: requestForm.priority,
        dueDate: new Date(requestForm.dueDate).toISOString(),
        notes: requestForm.notes || undefined
      })

      // Reset form and close dialog
      setRequestForm({
        documentType: '',
        description: '',
        priority: '',
        dueDate: '',
        notes: ''
      })
      setNewRequestDialogOpen(false)

      // Refetch requests to show the new one
      await fetchRequests(id, 5)

    } catch (error) {
      console.error('Failed to create request:', error)
      alert('Failed to create document request. Please try again.')
    }
  }

  // Document handling functions
  const currentItems = isSearching ? items : items.filter(item => item.path === currentPath)

  const getBreadcrumbs = () => {
    if (isSearching) {
      return [{ id: null, name: 'Search Results' }]
    }

    const breadcrumbs: { id: string | null; name: string }[] = [{ id: null, name: 'Documents' }]
    currentSegments.forEach((segment, idx) => {
      const segmentPath = normalizePath(currentSegments.slice(0, idx + 1).join('/'))
      breadcrumbs.push({ id: segmentPath, name: segment })
    })

    return breadcrumbs
  }

  const navigateToSegments = (segments: string[]) => {
    setCurrentSegments(segments)
  }

  const handleItemDoubleClick = (item: FolderItem) => {
    if (item.type === 'FOLDER') {
      navigateToSegments([...currentSegments, item.name])
    } else {
      setSelectedFileId(item.id)
      setPreviewOpen(true)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    if (!id) return

    try {
      const parentPathClean = cleanPathForApi(currentPath)
      const s3Base = `private/${id}`
      const parentPathStripped = parentPathClean === '/' ? '' : parentPathClean.replace(/^\/+|\/+$/g, '')
      const folderPathBase =
        parentPathStripped === ''
          ? `${s3Base}/${newFolderName}`
          : `${s3Base}/${parentPathStripped}/${newFolderName}`
      const folderPath = folderPathBase.endsWith('/') ? folderPathBase : `${folderPathBase}/`

      try {
        await createFolderPath(folderPath)
      } catch (s3Error) {
        console.error('S3 folder creation failed:', s3Error)
        throw new Error('Failed to create folder in storage. Please try again.')
      }

      try {
        await createFolder(newFolderName, parentPathClean, folderPath)
      } catch (apiError) {
        console.error('Database folder creation failed:', apiError)
        throw new Error('Folder created in storage but failed to save to database. Please refresh.')
      }

      setNewFolderName('')
      setCreateFolderDialogOpen(false)

      await memoizedFetchFiles(parentPathClean)
    } catch (error) {
      console.error('Failed to create folder:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create folder. Please try again.'
      alert(errorMessage)
    }
  }

  const handleDeleteItem = (item: FolderItem) => {
    setItemToDelete(item)
    setDeleteConfirmOpen(true)
  }

  const handleRenameItem = (item: FolderItem) => {
    setItemToRename(item)
    setNewName(item.name)
    setRenameDialogOpen(true)
  }

  const confirmRename = async () => {
    if (!itemToRename || !newName.trim()) return

    try {
      const apiFile = activeFiles.find((f: any) => {
        const fileId = f.SK.replace('FILE#', '').replace('FOLDER#', '')
        return fileId === itemToRename.id
      })

      if (!apiFile) {
        console.error('API file not found for rename')
        alert('File not found. Please refresh and try again.')
        setRenameDialogOpen(false)
        setItemToRename(null)
        return
      }

      await updateFile({
        fullPath: apiFile.fullPath,
        name: newName.trim()
      })

      if (itemToRename.type === 'FILE' || itemToRename.type === 'IMAGE') {
        setFileUrls(prev => {
          const updated = { ...prev }
          delete updated[itemToRename.id]
          return updated
        })
        fetchingUrlsRef.current.delete(itemToRename.id)
      }

      setRenameDialogOpen(false)
      setItemToRename(null)
      setNewName('')

      if (isSearching) {
        if (searchQuery.trim()) {
          searchFiles(searchQuery.trim(), id)
        }
      } else {
        memoizedFetchFiles(currentPathForApi)
      }
    } catch (error) {
      console.error('Failed to rename item:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to rename item. Please try again.'
      alert(errorMessage)
    }
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return

    try {
      const apiFile = activeFiles.find((f: any) => {
        const fileId = f.SK.replace('FILE#', '').replace('FOLDER#', '')
        return fileId === itemToDelete.id
      })

      if (!apiFile) {
        console.error('API file not found for deletion')
        alert('File not found. Please refresh and try again.')
        setDeleteConfirmOpen(false)
        setItemToDelete(null)
        return
      }

      await deleteFile(apiFile.fullPath)

      setDeleteConfirmOpen(false)
      setItemToDelete(null)

      if (isSearching) {
        if (searchQuery.trim()) {
          searchFiles(searchQuery.trim(), id)
        }
      } else {
        memoizedFetchFiles(currentPathForApi)
      }
    } catch (error) {
      console.error('Failed to delete item:', error)
      alert('Failed to delete item. Please try again.')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (item: FolderItem) => {
    if (item.type === 'FOLDER') return '📁'
    if (item.fileType?.startsWith('image/')) return '🖼️'
    if (item.fileType === 'application/pdf') return '📄'
    if (item.fileType?.includes('spreadsheet') || item.name.endsWith('.xlsx')) return '📊'
    if (item.fileType?.includes('document') || item.name.endsWith('.docx')) return '📝'
    return '📎'
  }

  const sortedItems = [...currentItems].sort((a, b) => {
    if (a.type === 'FOLDER' && (b.type === 'FILE' || b.type === 'IMAGE')) return -1
    if ((a.type === 'FILE' || a.type === 'IMAGE') && b.type === 'FOLDER') return 1
    return a.name.localeCompare(b.name)
  })

  const folders = sortedItems.filter(item => item.type === 'FOLDER')
  const files = sortedItems.filter(item => item.type === 'FILE' || item.type === 'IMAGE')

  const selectedFile = useMemo(() => {
    if (!selectedFileId) return null

    const selectedItem = items.find(i => i.id === selectedFileId)
    return {
      id: selectedFileId,
      name: selectedItem?.name || '',
      type: selectedItem?.fileType || '',
      url: fileUrls[selectedFileId] || '',
      size: selectedItem?.size || 0,
      uploadedAt: selectedItem?.uploadedAt,
      s3Key: selectedItem?.s3Key,
    }
  }, [selectedFileId, items, fileUrls])

  const previewFiles = useMemo(() => {
    return files.map(f => ({
      id: f.id,
      name: f.name,
      type: f.fileType || '',
      url: fileUrls[f.id] || '',
      size: f.size || 0,
      uploadedAt: f.uploadedAt,
      s3Key: f.s3Key,
    }))
  }, [files, fileUrls])

  const currentFolderName = currentSegments[currentSegments.length - 1] || 'All Documents'

  // Map API data to client format
  const allFilesCount = files.length
  const client = clientData ? {
    id: clientData.id,
    name: clientData.name,
    email: clientData.email,
    phone: formatPhone(clientData.phone),
    status: clientData.taxReturnStatus || 'DOCUMENTS_PENDING',
    taxYear: clientData.taxYear || 'N/A',
    address: clientData.address || 'N/A',
    ssn: formatSSN(clientData.ssn),
    filingStatus: clientData.filingStatus || 'N/A',
    dependents: clientData.numberOfDependents || 0,
    joinedDate: clientData.createdAt ? new Date(clientData.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A',
    lastActivity: getLastActivity(clientData.updatedAt),
    pendingDocs: clientData.pendingRequest || 0,
    unreadMessages: clientData.unreadMessages || 0,
    documentsUploaded: clientData.documentsUploaded || 0
  } : null

  // Loading state
  if (usersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading client details...</p>
        </div>
      </div>
    )
  }

  // Client not found
  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Client Not Found</h2>
          <p className="text-muted-foreground mb-4">The client you're looking for doesn't exist.</p>
          <Link href="/clients">
            <Button>Back to Clients</Button>
          </Link>
        </div>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    IN_PROGRESS: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    DOCUMENTS_PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    DOCUMENTS_RECEIVED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    READY_FOR_REVIEW: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    FILED: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    COMPLETE: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  }

  const statusLabels: Record<string, string> = {
    IN_PROGRESS: 'In Progress',
    DOCUMENTS_PENDING: 'Documents Pending',
    DOCUMENTS_RECEIVED: 'Documents Received',
    READY_FOR_REVIEW: 'Ready for Review',
    FILED: 'Filed',
    COMPLETE: 'Complete',
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/clients">
        <Button variant="ghost" size="sm">
          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Clients
        </Button>
      </Link>

      {/* Client Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">{getInitials(client.name)}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{client.name}</h1>
                <p className="text-muted-foreground">{client.email}</p>
                <p className="text-sm text-muted-foreground mt-1">{client.phone}</p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge className={statusColors[client.status]} variant="outline">
                    {statusLabels[client.status] || client.status}
                  </Badge>
                  <Badge variant="outline">Tax Year {client.taxYear}</Badge>
                </div>
              </div>
            </div>
            <div className="w-64">
              <Select
                value={client.status}
                onValueChange={handleStatusChange}
                disabled={updatingStatus}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DOCUMENTS_PENDING">Documents Pending</SelectItem>
                  <SelectItem value="DOCUMENTS_RECEIVED">Documents Received</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="READY_FOR_REVIEW">Ready for Review</SelectItem>
                  <SelectItem value="FILED">Filed</SelectItem>
                  <SelectItem value="COMPLETE">Complete</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Pending Documents</div>
            <div className="text-2xl font-bold mt-1">{client.pendingDocs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Unread Messages</div>
            <div className="text-2xl font-bold mt-1">{client.unreadMessages}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Documents Uploaded</div>
            <div className="text-2xl font-bold mt-1">{client.documentsUploaded}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Last Activity</div>
            <div className="text-lg font-semibold mt-1">{client.lastActivity}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents ({allFilesCount})</TabsTrigger>
          <TabsTrigger value="requests">Requests ({requests.length})</TabsTrigger>
          <TabsTrigger value="messages">Messages ({messages.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">Full Name</div>
                  <div className="font-medium">{client.name}</div>
                </div>
                <Separator />
                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div className="font-medium">{client.email}</div>
                </div>
                <Separator />
                <div>
                  <div className="text-sm text-muted-foreground">Phone</div>
                  <div className="font-medium">{client.phone}</div>
                </div>
                <Separator />
                <div>
                  <div className="text-sm text-muted-foreground">Address</div>
                  <div className="font-medium">{client.address}</div>
                </div>
                <Separator />
                <div>
                  <div className="text-sm text-muted-foreground">SSN</div>
                  <div className="font-medium">{client.ssn}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tax Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">Tax Year</div>
                  <div className="font-medium">{client.taxYear}</div>
                </div>
                <Separator />
                <div>
                  <div className="text-sm text-muted-foreground">Filing Status</div>
                  <div className="font-medium">{client.filingStatus}</div>
                </div>
                <Separator />
                <div>
                  <div className="text-sm text-muted-foreground">Number of Dependents</div>
                  <div className="font-medium">{client.dependents}</div>
                </div>
                <Separator />
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <Badge className={statusColors[client.status]} variant="outline">
                    {statusLabels[client.status] || client.status}
                  </Badge>
                </div>
                <Separator />
                <div>
                  <div className="text-sm text-muted-foreground">Client Since</div>
                  <div className="font-medium">{client.joinedDate}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          {/* Document Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dialog open={createFolderDialogOpen} onOpenChange={setCreateFolderDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                    New Folder
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Folder</DialogTitle>
                    <DialogDescription>
                      Create a new folder in {currentFolderName}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="folder-name">Folder Name</Label>
                      <Input
                        id="folder-name"
                        placeholder="e.g., 2025 Receipts"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !creatingFolder && handleCreateFolder()}
                        disabled={creatingFolder}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setCreateFolderDialogOpen(false)}
                      disabled={creatingFolder}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateFolder}
                      disabled={creatingFolder || !newFolderName.trim()}
                    >
                      {creatingFolder ? 'Creating...' : 'Create Folder'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload Files
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Upload Documents</DialogTitle>
                    <DialogDescription>
                      Upload files to {currentFolderName}
                    </DialogDescription>
                  </DialogHeader>
                  <FileUpload
                    userId={id}
                    parentPath={currentPathForApi}
                    onUploadComplete={() => {
                      setUploadDialogOpen(false)
                      memoizedFetchFiles(currentPathForApi)
                    }}
                    maxFiles={5}
                  />
                </DialogContent>
              </Dialog>
            </div>
            <div className="flex items-center gap-1 border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
            </div>
          </div>

          {/* Breadcrumb Navigation */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 overflow-x-auto">
                {getBreadcrumbs().map((crumb, index) => (
                  <div key={crumb.id || 'root'} className="flex items-center gap-2">
                    {index > 0 && <span className="text-muted-foreground">/</span>}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigateToSegments(crumb.id ? crumb.id.split('/').filter(Boolean) : [])}
                      className="h-8 hover:underline"
                    >
                      {crumb.name}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Search Bar */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <Input
                  placeholder="Search files and folders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {activeError && (
            <Alert variant="destructive">
              <AlertDescription>{activeError as any}</AlertDescription>
            </Alert>
          )}

          {/* Files and Folders Display */}
          <Card>
            <CardContent className="p-6">
              {activeLoading ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">⏳</div>
                  <p className="text-muted-foreground">Loading files...</p>
                </div>
              ) : sortedItems.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📁</div>
                  <h3 className="text-lg font-semibold mb-2">
                    {isSearching ? 'No items found' : 'This folder is empty'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {isSearching
                      ? 'Try adjusting your search'
                      : 'Create a folder or upload files to get started'}
                  </p>
                  {!isSearching && (
                    <div className="flex gap-2 justify-center">
                      <Button onClick={() => setCreateFolderDialogOpen(true)}>
                        Create Folder
                      </Button>
                      <Button onClick={() => setUploadDialogOpen(true)} variant="outline">
                        Upload Files
                      </Button>
                    </div>
                  )}
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {sortedItems.map((item) => (
                    <div
                      key={item.id}
                      onDoubleClick={() => handleItemDoubleClick(item)}
                      className="group border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-md transition-all cursor-pointer relative"
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            handleRenameItem(item)
                          }}>Rename</DropdownMenuItem>
                          <DropdownMenuItem>Move</DropdownMenuItem>
                          {item.type === 'FILE' && <DropdownMenuItem>Download</DropdownMenuItem>}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteItem(item)
                            }}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <div className="flex flex-col items-center text-center">
                        <div className="text-5xl mb-2">{getFileIcon(item)}</div>
                        <p className="font-medium text-sm truncate w-full mb-1">
                          {item.name}
                        </p>
                        {item.type === 'FILE' && item.size && (
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(item.size)}
                          </p>
                        )}
                        {item.type === 'FOLDER' && (
                          <p className="text-xs text-muted-foreground">
                            {((item.totalFiles ?? 1) - 1) || 0} items
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedItems.map((item) => (
                    <div
                      key={item.id}
                      onDoubleClick={() => handleItemDoubleClick(item)}
                      className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="text-3xl">{getFileIcon(item)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.name}</p>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            {item.type === 'FILE' && item.size && (
                              <>
                                <span>{formatFileSize(item.size)}</span>
                                {item.uploadedAt && (
                                  <>
                                    <span>•</span>
                                    <span>{item.uploadedAt}</span>
                                  </>
                                )}
                              </>
                            )}
                            {item.type === 'FOLDER' && (
                              <span>{((item.totalFiles ?? 1) - 1) || 0} items</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            handleRenameItem(item)
                          }}>Rename</DropdownMenuItem>
                          <DropdownMenuItem>Move</DropdownMenuItem>
                          {item.type === 'FILE' && <DropdownMenuItem>Download</DropdownMenuItem>}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteItem(item)
                            }}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Document Requests</CardTitle>
                <Button size="sm" onClick={() => setNewRequestDialogOpen(true)}>New Request</Button>
              </div>
              <CardDescription>Outstanding document requests for this client</CardDescription>
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading requests...</p>
                </div>
              ) : requestsError ? (
                <div className="text-center py-8">
                  <p className="text-red-600">Failed to load requests</p>
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No document requests yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((req) => (
                    <div key={req.documentRequestId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{req.documentType.replace(/_/g, ' ')}</p>
                          <Badge variant={req.priority === 'HIGH' ? 'destructive' : 'secondary'}>
                            {req.priority.toLowerCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Due: {new Date(req.dueDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20">
                        {req.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Message History</CardTitle>
                {clientConversationId && (
                  <Link href={`/messages?conversation=${clientConversationId}`}>
                    <Button size="sm">View Full Conversation</Button>
                  </Link>
                )}
              </div>
              <CardDescription>Recent messages with this client</CardDescription>
            </CardHeader>
            <CardContent>
              {messagesLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p>Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No messages yet</p>
                  {clientConversationId && (
                    <Link href={`/messages?conversation=${clientConversationId}`}>
                      <Button size="sm" variant="outline" className="mt-2">
                        Start Conversation
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div key={msg.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {msg.from === 'You' ? 'YO' : getInitials(client.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm">{msg.from}</p>
                          <p className="text-xs text-muted-foreground">{msg.date}</p>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{msg.preview}</p>
                      </div>
                      {/* {msg.unread && (
                        <Badge variant="default" className="h-5 px-2">New</Badge>
                      )} */}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>Recent activity for this client</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activity.map((item, index) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      {index < activity.length - 1 && (
                        <div className="flex-1 w-px bg-border mt-2" style={{ minHeight: '40px' }} />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-medium">{item.action}</p>
                      <p className="text-sm text-muted-foreground">{item.details}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Folder Dialog */}
      <Dialog open={createFolderDialogOpen} onOpenChange={setCreateFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Create a new folder in {currentFolderName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="folder-name" className="text-sm font-medium">
                Folder Name
              </label>
              <Input
                id="folder-name"
                placeholder="Enter folder name..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateFolder()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateFolderDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>Create Folder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Preview Modal */}
      <FilePreview
        file={selectedFile}
        files={previewFiles}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onNavigate={(fileId) => setSelectedFileId(fileId)}
      />

      {/* Delete Confirmation Dialog */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-xl flex flex-col items-center gap-4 max-w-md w-full mx-4">
            <div className="text-6xl mb-2">⚠️</div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 text-center">
              Are you sure?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
              {itemToDelete && (
                <>
                  Do you want to delete <strong>"{itemToDelete.name}"</strong>? This action cannot be undone.
                </>
              )}
            </p>
            <div className="flex gap-3 w-full mt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setDeleteConfirmOpen(false)
                  setItemToDelete(null)
                }}
                disabled={deletingFile}
              >
                No
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={confirmDelete}
                disabled={deletingFile}
              >
                {deletingFile ? 'Deleting...' : 'Yes, Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Dialog */}
      {renameDialogOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Rename {itemToRename?.type === 'FOLDER' ? 'Folder' : 'File'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => {
                  setRenameDialogOpen(false)
                  setItemToRename(null)
                  setNewName('')
                }}
                disabled={updatingFile}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rename-input">New Name</Label>
                <Input
                  id="rename-input"
                  placeholder="Enter new name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !updatingFile && confirmRename()}
                  disabled={updatingFile}
                  autoFocus
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRenameDialogOpen(false)
                    setItemToRename(null)
                    setNewName('')
                  }}
                  disabled={updatingFile}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmRename}
                  disabled={updatingFile || !newName.trim()}
                >
                  {updatingFile ? 'Updating...' : 'Update'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Request Dialog */}
      <Dialog open={newRequestDialogOpen} onOpenChange={setNewRequestDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Document Request</DialogTitle>
            <DialogDescription>
              Request a document for {client?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Document Type */}
            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type *</Label>
              <Select
                value={requestForm.documentType}
                onValueChange={(value) => setRequestForm(prev => ({ ...prev, documentType: value }))}
                disabled={creatingRequest}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="W2">W-2</SelectItem>
                  <SelectItem value="W4">W-4</SelectItem>
                  <SelectItem value="SCHEDULE_C">Schedule C</SelectItem>
                  <SelectItem value="SCHEDULE_E">Schedule E</SelectItem>
                  <SelectItem value="PROPERTY_TAX_STATEMENT">Property Tax Statement</SelectItem>
                  <SelectItem value="MORTGAGE_INTEREST_1098">Mortgage Interest (1098)</SelectItem>
                  <SelectItem value="STUDENT_LOAN_INTEREST">Student Loan Interest</SelectItem>
                  <SelectItem value="MEDICAL_EXPENSE_RECEIPTS">Medical Expense Receipts</SelectItem>
                  <SelectItem value="CHARITABLE_DONATION_RECEIPTS">Charitable Donation Receipts</SelectItem>
                  <SelectItem value="BUSINESS_EXPENSE_RECEIPTS">Business Expense Receipts</SelectItem>
                  <SelectItem value="DRIVERS_LICENSE_ID">Driver's License / ID</SelectItem>
                  <SelectItem value="SOCIAL_SECURITY_CARD">Social Security Card</SelectItem>
                  <SelectItem value="PRIOR_YEAR_RETURN">Prior Year Return</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Enter description"
                value={requestForm.description}
                onChange={(e) => setRequestForm(prev => ({ ...prev, description: e.target.value }))}
                disabled={creatingRequest}
                rows={3}
              />
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select
                value={requestForm.priority}
                onValueChange={(value) => setRequestForm(prev => ({ ...prev, priority: value }))}
                disabled={creatingRequest}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  {/* <SelectItem value="NORMAL">Normal</SelectItem> */}
                  <SelectItem value="HIGH">High</SelectItem>
                  {/* <SelectItem value="URGENT">Urgent</SelectItem> */}
                </SelectContent>
              </Select>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                value={requestForm.dueDate}
                onChange={(e) => setRequestForm(prev => ({ ...prev, dueDate: e.target.value }))}
                disabled={creatingRequest}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes"
                value={requestForm.notes}
                onChange={(e) => setRequestForm(prev => ({ ...prev, notes: e.target.value }))}
                disabled={creatingRequest}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNewRequestDialogOpen(false)
                setRequestForm({
                  documentType: '',
                  description: '',
                  priority: '',
                  dueDate: '',
                  notes: ''
                })
              }}
              disabled={creatingRequest}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateRequest}
              disabled={creatingRequest || !requestForm.documentType || !requestForm.description || !requestForm.priority || !requestForm.dueDate}
            >
              {creatingRequest ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
