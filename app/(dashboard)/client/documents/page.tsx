'use client'

import { useState, useEffect } from 'react'
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

// Mock folder structure - in production, fetch from API
interface FolderItem {
  id: string
  name: string
  type: 'folder' | 'file'
  parentId: string | null
  path: string
  size?: number
  uploadedAt?: string
  fileType?: string
}

export default function ClientDocumentsPage() {
  const { user } = useAuth()
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  // Mock hierarchical structure
  const [items, setItems] = useState<FolderItem[]>([
    // Root folders
    { id: '1', name: '2025 Tax Year', type: 'folder', parentId: null, path: '/2025 Tax Year' },
    { id: '2', name: '2024 Tax Year', type: 'folder', parentId: null, path: '/2024 Tax Year' },
    { id: '3', name: 'Receipts', type: 'folder', parentId: null, path: '/Receipts' },

    // 2025 subfolders
    { id: '11', name: 'W-2 Forms', type: 'folder', parentId: '1', path: '/2025 Tax Year/W-2 Forms' },
    { id: '12', name: '1099 Forms', type: 'folder', parentId: '1', path: '/2025 Tax Year/1099 Forms' },
    { id: '13', name: 'Deductions', type: 'folder', parentId: '1', path: '/2025 Tax Year/Deductions' },

    // 2024 subfolders
    { id: '21', name: 'Final Return', type: 'folder', parentId: '2', path: '/2024 Tax Year/Final Return' },
    { id: '22', name: 'Supporting Docs', type: 'folder', parentId: '2', path: '/2024 Tax Year/Supporting Docs' },

    // Receipts subfolders
    { id: '31', name: 'Medical', type: 'folder', parentId: '3', path: '/Receipts/Medical' },
    { id: '32', name: 'Business', type: 'folder', parentId: '3', path: '/Receipts/Business' },
    { id: '33', name: 'Charitable', type: 'folder', parentId: '3', path: '/Receipts/Charitable' },

    // Sample files
    { id: 'f1', name: 'W2_ABC_Company.pdf', type: 'file', parentId: '11', path: '/2025 Tax Year/W-2 Forms/W2_ABC_Company.pdf', size: 245000, uploadedAt: '2025-02-15', fileType: 'application/pdf' },
    { id: 'f2', name: 'W2_XYZ_Corp.pdf', type: 'file', parentId: '11', path: '/2025 Tax Year/W-2 Forms/W2_XYZ_Corp.pdf', size: 198000, uploadedAt: '2025-02-16', fileType: 'application/pdf' },
    { id: 'f3', name: '1099_INT_Bank.pdf', type: 'file', parentId: '12', path: '/2025 Tax Year/1099 Forms/1099_INT_Bank.pdf', size: 187000, uploadedAt: '2025-02-20', fileType: 'application/pdf' },
    { id: 'f4', name: 'Medical_Receipt_Jan.jpg', type: 'file', parentId: '31', path: '/Receipts/Medical/Medical_Receipt_Jan.jpg', size: 520000, uploadedAt: '2025-01-30', fileType: 'image/jpeg' },
    { id: 'f5', name: '2024_Return_Final.pdf', type: 'file', parentId: '21', path: '/2024 Tax Year/Final Return/2024_Return_Final.pdf', size: 890000, uploadedAt: '2024-04-10', fileType: 'application/pdf' },
  ])

  // Get current folder items
  const currentItems = items.filter(item => item.parentId === currentFolderId)

  // Get breadcrumb path
  const getBreadcrumbs = () => {
    const breadcrumbs: { id: string | null; name: string }[] = [{ id: null, name: 'My Documents' }]

    let currentId = currentFolderId
    while (currentId) {
      const folder = items.find(item => item.id === currentId)
      if (folder) {
        breadcrumbs.unshift({ id: folder.id, name: folder.name })
        currentId = folder.parentId
      } else {
        break
      }
    }

    return breadcrumbs
  }

  const handleItemDoubleClick = (item: FolderItem) => {
    if (item.type === 'folder') {
      setCurrentFolderId(item.id)
    } else {
      setSelectedFileId(item.id)
      setPreviewOpen(true)
    }
  }

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return

    const newFolder: FolderItem = {
      id: `folder-${Date.now()}`,
      name: newFolderName,
      type: 'folder',
      parentId: currentFolderId,
      path: currentFolderId
        ? `${items.find(i => i.id === currentFolderId)?.path}/${newFolderName}`
        : `/${newFolderName}`,
    }

    setItems([...items, newFolder])
    setNewFolderName('')
    setCreateFolderDialogOpen(false)
  }

  const handleDeleteItem = (itemId: string) => {
    // In production, this would recursively delete children
    setItems(items.filter(item => item.id !== itemId))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (item: FolderItem) => {
    if (item.type === 'folder') return '📁'
    if (item.fileType?.startsWith('image/')) return '🖼️'
    if (item.fileType === 'application/pdf') return '📄'
    if (item.fileType?.includes('spreadsheet') || item.name.endsWith('.xlsx')) return '📊'
    if (item.fileType?.includes('document') || item.name.endsWith('.docx')) return '📝'
    return '📎'
  }

  const filteredItems = currentItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Sort: folders first, then files alphabetically
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (a.type === 'folder' && b.type === 'file') return -1
    if (a.type === 'file' && b.type === 'folder') return 1
    return a.name.localeCompare(b.name)
  })

  const folders = sortedItems.filter(item => item.type === 'folder')
  const files = sortedItems.filter(item => item.type === 'file')

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground mt-2">
            Organize and manage your tax documents
          </p>
        </div>
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
                  Create a new folder in {currentFolderId ? items.find(i => i.id === currentFolderId)?.name : 'My Documents'}
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
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
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
                  Upload files to {currentFolderId ? items.find(i => i.id === currentFolderId)?.name : 'My Documents'}
                </DialogDescription>
              </DialogHeader>
              <FileUpload onUpload={ async () => {}} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
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
                    onClick={() => setCurrentFolderId(crumb.id)}
                    className="h-8 hover:underline"
                  >
                    {crumb.name}
                  </Button>
                </div>
              ))}
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

      {/* Files and Folders Display */}
      <Card>
        <CardContent className="p-6">
          {sortedItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📁</div>
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? 'No items found' : 'This folder is empty'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? 'Try adjusting your search'
                  : 'Create a folder or upload files to get started'}
              </p>
              {!searchQuery && (
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
                      <DropdownMenuItem>Rename</DropdownMenuItem>
                      <DropdownMenuItem>Move</DropdownMenuItem>
                      {item.type === 'file' && <DropdownMenuItem>Download</DropdownMenuItem>}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeleteItem(item.id)}
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
                    {item.type === 'file' && item.size && (
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(item.size)}
                      </p>
                    )}
                    {item.type === 'folder' && (
                      <p className="text-xs text-muted-foreground">
                        {items.filter(i => i.parentId === item.id).length} items
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
                        {item.type === 'file' && item.size && (
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
                        {item.type === 'folder' && (
                          <span>{items.filter(i => i.parentId === item.id).length} items</span>
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
                      <DropdownMenuItem>Rename</DropdownMenuItem>
                      <DropdownMenuItem>Move</DropdownMenuItem>
                      {item.type === 'file' && <DropdownMenuItem>Download</DropdownMenuItem>}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeleteItem(item.id)}
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

      {/* File Preview Modal */}
      <FilePreview
        file={selectedFileId ? {
          id: selectedFileId,
          name: items.find(i => i.id === selectedFileId)?.name || '',
          type: items.find(i => i.id === selectedFileId)?.fileType || '',
          url: 'https://www.irs.gov/pub/irs-pdf/fw2.pdf',
          size: items.find(i => i.id === selectedFileId)?.size || 0,
          uploadedAt: items.find(i => i.id === selectedFileId)?.uploadedAt,
        } : null}
        files={files.map(f => ({
          id: f.id,
          name: f.name,
          type: f.fileType || '',
          url: 'https://www.irs.gov/pub/irs-pdf/fw2.pdf',
          size: f.size || 0,
          uploadedAt: f.uploadedAt,
        }))}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onNavigate={(id) => setSelectedFileId(id)}
      />
    </div>
  )
}
