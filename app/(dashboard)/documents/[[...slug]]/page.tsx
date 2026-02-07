'use client'

import { useState, useEffect, Suspense, useMemo, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { FileUpload } from '@/components/files/FileUpload'
import { FilePreview } from '@/components/files/FilePreview'
import { useAuth } from '@/contexts/AuthContext'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useListUsers } from '@/hooks/useUserQuery'
import { useFetchFiles, useCreateFolder, useSearchFiles, useDeleteFile, useUpdateFile } from '@/hooks/useFileQuery'
import { createFolderPath, getFileUrlForPreview } from '@/lib/storage/fileUpload'

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
  documentRequestId?: string
  documentRequestPK?: string
  documentRequestSK?: string
}

function normalizePath(path: string) {
  const cleaned = path.replace(/^\/+|\/+$/g, '')
  return cleaned === '' ? '/' : `/${cleaned}`
}

function cleanPathForApi(path: string) {
  // Always return leading + trailing slash (except root stays "/")
  const normalized = normalizePath(path)
  return normalized === '/' ? '/' : `${normalized}/`
}

function DocumentsView({
  userId,
  userName,
  pathSegments = [],
}: {
  userId?: string
  userName?: string
  pathSegments?: string[]
}) {
  const router = useRouter()
  const { user } = useAuth()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [currentSegments, setCurrentSegments] = useState<string[]>(pathSegments)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<FolderItem | null>(null)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [itemToRename, setItemToRename] = useState<FolderItem | null>(null)
  const [newName, setNewName] = useState('')
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({})
  const fetchingUrlsRef = useRef<Set<string>>(new Set())
  const fileUrlsRef = useRef<Record<string, string>>({})

  // TAX_PRO viewing another user's documents (read-only mode)
  const isTaxProViewingClient = user?.role === 'TAX_PRO' && !!userId && userId !== user.id

  // Sync local path segments with URL-driven segments
  useEffect(() => {
    setCurrentSegments(pathSegments)
  }, [pathSegments])

  useEffect(() => {
    fileUrlsRef.current = fileUrls
  }, [fileUrls])

  useEffect(() => {
    console.log('Current fileUrls state:', fileUrls)
  }, [fileUrls])

  const { files: apiFiles, loading, error, fetchFiles } = useFetchFiles()
  const { files: searchResults, loading: searchLoading, error: searchError, searchFiles } = useSearchFiles()
  const { createFolder, loading: creatingFolder } = useCreateFolder()
  const { deleteFile, loading: deletingFile } = useDeleteFile()
  const { updateFile, loading: updatingFile } = useUpdateFile()

  const isSearching = searchQuery.trim().length > 0
  const activeFiles = isSearching ? searchResults : apiFiles
  const activeLoading = isSearching ? searchLoading : loading
  const activeError = isSearching ? searchError : error

  const currentPath = useMemo(() => {
    if (!currentSegments || currentSegments.length === 0) return '/'
    return normalizePath(currentSegments.join('/'))
  }, [currentSegments])

  const currentPathForApi = useMemo(() => cleanPathForApi(currentPath), [currentPath])

  const memoizedFetchFiles = useCallback(
    (path: string) => {
      if (userId) {
        fetchFiles(path, userId)
      }
    },
    [userId, fetchFiles]
  )

  // Search is debounced; normal folder listing is fetched immediately on path change
  useEffect(() => {
    const q = searchQuery.trim()
    if (q.length === 0) return

    const timeoutId = setTimeout(() => {
      searchFiles(q, userId)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, searchFiles, userId])

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
        documentRequestId: item.documentRequestId,
        documentRequestPK: item.documentRequestPK,
        documentRequestSK: item.documentRequestSK,
      }
    })
  }, [activeFiles])

  useEffect(() => {
    if (!userId) return
    if (isSearching) return
    memoizedFetchFiles(currentPathForApi)
  }, [userId, isSearching, memoizedFetchFiles, currentPathForApi])

  useEffect(() => {
    const fetchFileUrls = async () => {
      const fileItems = items.filter(item => (item.type === 'FILE' || item.type === 'IMAGE') && item.s3Key)
      console.log('Files to fetch URLs for:', fileItems)

      for (const item of fileItems) {
        if (fileUrlsRef.current[item.id] || fetchingUrlsRef.current.has(item.id) || !item.fullPath) {
          continue
        }

        fetchingUrlsRef.current.add(item.id)
        try {
          const url = await getFileUrlForPreview(item.fullPath)
          console.log('Generated URL for', item.name, ':', url)
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

  const currentItems = isSearching ? items : items.filter(item => item.path === currentPath)

  // Get the current folder's document request info by looking at the parent level
  const currentFolderDocumentRequest = useMemo(() => {
    if (currentSegments.length === 0) return { id: undefined, PK: undefined, SK: undefined }

    // Get the parent path to find the current folder in the parent's items
    const parentSegments = currentSegments.slice(0, -1)
    const parentPath = parentSegments.length === 0 ? '/' : normalizePath(parentSegments.join('/'))
    const currentFolderName = currentSegments[currentSegments.length - 1]

    // Find the current folder in the items
    const currentFolder = items.find(
      item => item.type === 'FOLDER' &&
              item.name === currentFolderName &&
              item.path === parentPath
    )

    return {
      id: currentFolder?.documentRequestId,
      PK: currentFolder?.documentRequestPK,
      SK: currentFolder?.documentRequestSK
    }
  }, [items, currentSegments])

  const getBreadcrumbs = () => {
    if (isSearching) {
      return [{ id: null, name: 'Search Results' }]
    }

    const breadcrumbs: { id: string | null; name: string }[] = [{ id: null, name: 'My Documents' }]
    currentSegments.forEach((segment, idx) => {
      const segmentPath = normalizePath(currentSegments.slice(0, idx + 1).join('/'))
      breadcrumbs.push({ id: segmentPath, name: segment })
    })

    return breadcrumbs
  }

  const buildDocumentsPath = useCallback(
    (segments: string[]) => {
      if (!userId) return '/documents'
      const cleanSegments = segments.filter(Boolean)
      const pathPart = cleanSegments.length > 0 ? `/${cleanSegments.join('/')}` : ''
      return `/documents/${userId}${pathPart}`
    },
    [userId]
  )

  const navigateToSegments = useCallback(
    (segments: string[]) => {
      router.push(buildDocumentsPath(segments))
    },
    [router, buildDocumentsPath]
  )

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
    if (!userId) return

    try {
      const parentPathClean = cleanPathForApi(currentPath) // ensures leading+trailing slash or root "/"
      const s3Base = `private/${userId}`
      // Strip leading/trailing slashes for safe concat
      const parentPathStripped = parentPathClean === '/' ? '' : parentPathClean.replace(/^\/+|\/+$/g, '')
      const folderPathBase =
        parentPathStripped === ''
          ? `${s3Base}/${newFolderName}`
          : `${s3Base}/${parentPathStripped}/${newFolderName}`
      // Ensure single trailing slash for folders
      const folderPath = folderPathBase.endsWith('/') ? folderPathBase : `${folderPathBase}/`

      // First create the folder in S3 - wait for it to complete
      try {
        await createFolderPath(folderPath)
      } catch (s3Error) {
        console.error('S3 folder creation failed:', s3Error)
        throw new Error('Failed to create folder in storage. Please try again.')
      }

      // Only call createFile API after successful S3 folder creation
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

      // Update database with new name
      await updateFile({
        fullPath: apiFile.fullPath,
        name: newName.trim()
      })

      // Clear cached URL for renamed file so it regenerates with new S3 key
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
          searchFiles(searchQuery.trim())
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
          searchFiles(searchQuery.trim())
        }
      } else {
        memoizedFetchFiles(currentPathForApi)
      }
    } catch (error) {
      console.error('Failed to delete item:', error)
      alert('Failed to delete item. Please try again.')
    }
  }

  useEffect(() => {
    console.log('📦 apiFiles changed:', apiFiles.length)
  }, [apiFiles])

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

  const filteredItems = currentItems

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (a.type === 'FOLDER' && (b.type === 'FILE' || b.type === 'IMAGE')) return -1
    if ((a.type === 'FILE' || a.type === 'IMAGE') && b.type === 'FOLDER') return 1
    return a.name.localeCompare(b.name)
  })

  const folders = sortedItems.filter(item => item.type === 'FOLDER')
  const files = sortedItems.filter(item => item.type === 'FILE' || item.type === 'IMAGE')

  const selectedFile = useMemo(() => {
    if (!selectedFileId) return null

    const selectedItem = items.find(i => i.id === selectedFileId)
    const fileData = {
      id: selectedFileId,
      name: selectedItem?.name || '',
      type: selectedItem?.fileType || '',
      url: fileUrls[selectedFileId] || '',
      size: selectedItem?.size || 0,
      uploadedAt: selectedItem?.uploadedAt,
      s3Key: selectedItem?.s3Key,
    }
    console.log('FilePreview file data:', fileData)
    return fileData
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

  const currentFolderName = currentSegments[currentSegments.length - 1] || 'My Documents'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {isTaxProViewingClient && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push('/documents')}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {user?.role === 'TAX_PRO' && userName ? `${userName}'s Documents` : 'Documents'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {user?.role === 'TAX_PRO' && userName
                ? `Manage documents for ${userName}`
                : 'Organize and manage your tax documents'}
            </p>
          </div>
        </div>
        {!isTaxProViewingClient && (
          <div className="flex gap-2">
            <Dialog open={createFolderDialogOpen} onOpenChange={setCreateFolderDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
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
                    {creatingFolder ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </>
                    ) : (
                      'Create Folder'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg">
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
                  userId={userId || ''}
                  parentPath={currentPathForApi}
                  onUploadComplete={() => {
                    setUploadDialogOpen(false)
                    memoizedFetchFiles(currentPathForApi)
                  }}
                  maxFiles={5}
                  documentRequestId={currentFolderDocumentRequest.id}
                  documentRequestSK={currentFolderDocumentRequest.SK}
                />
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm overflow-x-auto">
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

            <div className="flex items-center gap-2">
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
        </CardContent>
      </Card>

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
              {!isSearching && !isTaxProViewingClient && (
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
                  {!isTaxProViewingClient && !(item.type === 'FOLDER' && item.documentRequestId) && (
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
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRenameItem(item)
                          }}
                        >
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          Move
                        </DropdownMenuItem>
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
                  )}

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
                  {!isTaxProViewingClient && !(item.type === 'FOLDER' && item.documentRequestId) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRenameItem(item)
                          }}
                        >
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          Move
                        </DropdownMenuItem>
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
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <FilePreview
        file={selectedFile}
        files={previewFiles}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onNavigate={(id) => setSelectedFileId(id)}
      />

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
                {deletingFile ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Yes, Delete'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

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
                  {updatingFile ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </>
                  ) : (
                    'Update'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ClientListView() {
  const router = useRouter()
  const { user } = useAuth()
  const { users, loading, error } = useListUsers()
  const [searchQuery, setSearchQuery] = useState('')
  const clients = users?.filter(user => {
    return user.role === 'CLIENT' &&
      user.name?.toLowerCase().includes(searchQuery.toLowerCase())
  }) || []

  const handleClientClick = (userId: string) => {
    router.push(`/documents/${userId}`)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Documents</h1>
          <p className="text-muted-foreground mt-2">
            Select a client to view their documents
          </p>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p>Loading clients...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Documents</h1>
          <p className="text-muted-foreground mt-2">
            Select a client to view their documents
          </p>
        </div>
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load clients. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Documents</h1>
          <p className="text-muted-foreground mt-2">
            Select a client to view their documents
          </p>
        </div>

        {/* TAX_PRO can also access their own documents */}
        {user?.id && (
          <Button
            variant="outline"
            onClick={() => router.push(`/documents/${user.id}`)}
          >
            My Documents
          </Button>
        )}
      </div>

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
              placeholder="Search clients by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          {clients.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? 'No clients found' : 'No clients available'}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'Try adjusting your search'
                  : 'No clients have been assigned to you yet'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map((client) => (
                <Card
                  key={client.id}
                  className="cursor-pointer hover:shadow-lg transition-all hover:border-primary"
                  onClick={() => handleClientClick(client.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-lg font-semibold text-primary">
                            {client.name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{client.name}</h3>
                          <p className="text-sm text-muted-foreground">{client.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      {client.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span>{client.phone}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Badge variant={client.status === 'online' ? 'default' : 'secondary'}>
                          {client.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <Button variant="outline" size="sm" className="w-full">
                        View Documents
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function DocumentsPageContent() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams<{ slug?: string[] }>()
  const slugParam = params?.slug
  const slugArray = (Array.isArray(slugParam) ? slugParam : (typeof slugParam === 'string' ? [slugParam] : [])).map(segment => decodeURIComponent(segment))
  const selectedUserId = slugArray[0]
  const folderSegments = slugArray.slice(1)

  useEffect(() => {
    if (!user) return
    if (user.role !== 'TAX_PRO' && (!selectedUserId || selectedUserId !== user.id)) {
      router.replace(`/documents/${user.id}`)
    }
  }, [user, selectedUserId, router])

  if (!user) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p>Loading user information...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (selectedUserId) {
    return <DocumentsView userId={selectedUserId} userName="Client Documents" pathSegments={folderSegments} />
  }

  if (user?.role === 'TAX_PRO') {
    return <ClientListView />
  }

  return <DocumentsView userId={user?.id} userName={user?.name} pathSegments={folderSegments} />
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p>Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <DocumentsPageContent />
    </Suspense>
  )
}
