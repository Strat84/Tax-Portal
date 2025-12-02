'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { FileUpload } from '@/components/files/FileUpload'
import { FilePreview } from '@/components/files/FilePreview'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/AuthContext'
import { useDocuments } from '@/hooks/useDocuments'
import { uploadDocument, getDocumentUrl } from '@/lib/api/documents'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function ClientDocumentsPage() {
  const { user } = useAuth()
  const { documents, loading, error, refetch } = useDocuments(user?.id || null)

  const [currentFolder, setCurrentFolder] = useState('/')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [documentUrls, setDocumentUrls] = useState<Record<string, string>>({})

  // Fetch signed URLs for all documents
  useEffect(() => {
    const fetchUrls = async () => {
      if (!documents.length) return

      const urls: Record<string, string> = {}
      await Promise.all(
        documents.map(async (doc) => {
          try {
            const url = await getDocumentUrl(doc.path)
            urls[doc.id] = url
          } catch (err) {
            console.error(`Failed to fetch URL for ${doc.name}:`, err)
          }
        })
      )
      setDocumentUrls(urls)
    }

    fetchUrls()
  }, [documents])

  // TODO: Fetch folders from API (future enhancement)
  const folders = [
    { id: '1', name: '2025-Tax', path: '/2025-Tax', fileCount: 12 },
    { id: '2', name: 'W2s', path: '/2025-Tax/W2s', fileCount: 3, parent: '2025-Tax' },
    { id: '3', name: '1099s', path: '/2025-Tax/1099s', fileCount: 5, parent: '2025-Tax' },
    { id: '4', name: 'Receipts', path: '/2025-Tax/Receipts', fileCount: 4, parent: '2025-Tax' },
  ]

  const handleUpload = async (files: File[]) => {
    if (!user) return

    setUploading(true)
    setUploadError(null)

    try {
      // Upload all files
      await Promise.all(
        files.map(file => uploadDocument(file, user.id, null))
      )

      // Refresh the documents list
      await refetch()

      setUploadDialogOpen(false)
    } catch (err: any) {
      console.error('Upload error:', err)
      setUploadError(err.message || 'Failed to upload files')
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (type: string, name: string) => {
    if (type.startsWith('image/')) return '🖼️'
    if (type === 'application/pdf') return '📄'
    if (type.includes('spreadsheet') || name.endsWith('.xlsx')) return '📊'
    if (type.includes('document') || name.endsWith('.docx')) return '📝'
    return '📎'
  }

  // Convert documents to file format for display
  const files = documents.map(doc => ({
    id: doc.id,
    name: doc.name,
    size: doc.size,
    type: doc.type,
    url: documentUrls[doc.id] || '',
    uploadedAt: new Date(doc.uploadedAt).toLocaleDateString(),
    tags: doc.tags || [],
    folder: currentFolder,
  }))

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleFileClick = (fileId: string) => {
    setSelectedFileId(fileId)
    setPreviewOpen(true)
  }

  const handleNavigate = (fileId: string) => {
    setSelectedFileId(fileId)
  }

  const selectedFile = files.find(f => f.id === selectedFileId) || null

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading documents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground mt-2">
            Manage your tax documents and files
          </p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <svg
                className="h-5 w-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Upload Files
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Documents</DialogTitle>
              <DialogDescription>
                Upload your tax documents, receipts, and forms
              </DialogDescription>
            </DialogHeader>
            {uploadError && (
              <Alert variant="destructive">
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}
            <FileUpload onUpload={handleUpload} />
            {uploading && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
                <p className="text-sm text-muted-foreground">Uploading files...</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Breadcrumb & Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentFolder('/')}
                className="h-8"
              >
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Home
              </Button>
              {currentFolder !== '/' && (
                <>
                  <span className="text-muted-foreground">/</span>
                  <span className="font-medium">{currentFolder}</span>
                </>
              )}
            </div>

            {/* View Toggle */}
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

      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        {/* Sidebar - Folders */}
        <Card>
          <CardHeader>
            <CardTitle>Folders</CardTitle>
            <CardDescription>Organize your documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {folders.map((folder) => (
                <Button
                  key={folder.id}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => setCurrentFolder(folder.path)}
                >
                  <svg
                    className="h-4 w-4 mr-2 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                  <span className="flex-1 text-left truncate">{folder.name}</span>
                  <Badge variant="secondary" className="ml-2">
                    {folder.fileCount}
                  </Badge>
                </Button>
              ))}
            </div>

            <Button variant="outline" className="w-full mt-4">
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Folder
            </Button>
          </CardContent>
        </Card>

        {/* Main Content - Files */}
        <div className="space-y-4">
          {/* Search & Filter */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <Input
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Files</SelectItem>
                    <SelectItem value="pdf">PDFs</SelectItem>
                    <SelectItem value="images">Images</SelectItem>
                    <SelectItem value="documents">Documents</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Files Display */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Files</CardTitle>
                <span className="text-sm text-muted-foreground">
                  {filteredFiles.length} files
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => handleFileClick(file.id)}
                      className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="text-4xl mb-2">
                          {getFileIcon(file.type, file.name)}
                        </div>
                        <p className="font-medium text-sm truncate w-full mb-1">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground mb-2">
                          {formatFileSize(file.size)}
                        </p>
                        <div className="flex flex-wrap gap-1 justify-center">
                          {file.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => handleFileClick(file.id)}
                      className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="text-2xl">
                          {getFileIcon(file.type, file.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{file.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                            <span className="text-muted-foreground">•</span>
                            <p className="text-sm text-muted-foreground">
                              {file.uploadedAt}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                        <Button variant="ghost" size="sm">
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                            />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {filteredFiles.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📁</div>
                  <h3 className="text-lg font-semibold mb-2">No files found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery
                      ? 'Try adjusting your search'
                      : 'Upload your first document to get started'}
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => setUploadDialogOpen(true)}>
                      Upload Files
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* File Preview Modal */}
      <FilePreview
        file={selectedFile}
        files={filteredFiles}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onNavigate={handleNavigate}
      />
    </div>
  )
}
