'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FilePreview } from '@/components/files/FilePreview'

// Hierarchical folder structure
interface FolderItem {
  id: string
  name: string
  type: 'folder' | 'file'
  parentId: string | null
  path: string
  size?: number
  uploadedAt?: string
  fileType?: string
  status?: 'pending' | 'reviewed'
  tags?: string[]
}

interface PageProps {
  params: { id: string }
}

export default function ClientDetailPage({ params }: PageProps) {
  const { id } = params

  // Document management state
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  // Mock client data - in production, fetch based on ID
  const client = {
    id,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '(555) 123-4567',
    status: 'in_progress',
    taxYear: 2025,
    address: '123 Main St, Anytown, ST 12345',
    ssn: '***-**-1234',
    filingStatus: 'Married Filing Jointly',
    dependents: 2,
    joinedDate: 'January 15, 2024',
    lastActivity: '2 hours ago',
    pendingDocs: 2,
    unreadMessages: 1,
  }

  // Mock hierarchical document structure for this client
  const [folderItems, setFolderItems] = useState<FolderItem[]>([
    // Root folders
    { id: '1', name: '2025 Tax Year', type: 'folder', parentId: null, path: '/2025 Tax Year' },
    { id: '2', name: '2024 Tax Year', type: 'folder', parentId: null, path: '/2024 Tax Year' },
    { id: '3', name: 'Receipts', type: 'folder', parentId: null, path: '/Receipts' },

    // 2025 subfolders
    { id: '11', name: 'W-2 Forms', type: 'folder', parentId: '1', path: '/2025 Tax Year/W-2 Forms' },
    { id: '12', name: '1099 Forms', type: 'folder', parentId: '1', path: '/2025 Tax Year/1099 Forms' },
    { id: '13', name: 'Deductions', type: 'folder', parentId: '1', path: '/2025 Tax Year/Deductions' },

    // Files in W-2 Forms
    { id: 'f1', name: 'W2_ABC_Company.pdf', type: 'file', parentId: '11', path: '/2025 Tax Year/W-2 Forms/W2_ABC_Company.pdf', size: 245000, uploadedAt: '2025-02-15', fileType: 'application/pdf', status: 'reviewed', tags: ['W-2', '2025'] },

    // Files in 1099 Forms
    { id: 'f2', name: '1099-INT_Bank.pdf', type: 'file', parentId: '12', path: '/2025 Tax Year/1099 Forms/1099-INT_Bank.pdf', size: 180000, uploadedAt: '2025-02-12', fileType: 'application/pdf', status: 'pending', tags: ['1099', '2025'] },

    // Files in Deductions
    { id: 'f3', name: 'Medical_Expenses.xlsx', type: 'file', parentId: '13', path: '/2025 Tax Year/Deductions/Medical_Expenses.xlsx', size: 320000, uploadedAt: '2025-02-10', fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', status: 'reviewed', tags: ['deductions', '2025'] },

    // 2024 subfolders
    { id: '21', name: 'W-2 Forms', type: 'folder', parentId: '2', path: '/2024 Tax Year/W-2 Forms' },
    { id: 'f4', name: 'W2_ABC_Company_2024.pdf', type: 'file', parentId: '21', path: '/2024 Tax Year/W-2 Forms/W2_ABC_Company_2024.pdf', size: 240000, uploadedAt: '2024-02-15', fileType: 'application/pdf', status: 'reviewed', tags: ['W-2', '2024'] },

    // Receipts subfolders
    { id: '31', name: 'Medical', type: 'folder', parentId: '3', path: '/Receipts/Medical' },
    { id: '32', name: 'Charitable', type: 'folder', parentId: '3', path: '/Receipts/Charitable' },
    { id: 'f5', name: 'Receipt_Medical.jpg', type: 'file', parentId: '31', path: '/Receipts/Medical/Receipt_Medical.jpg', size: 520000, uploadedAt: '2025-02-08', fileType: 'image/jpeg', status: 'pending', tags: ['receipt', 'medical'] },
  ])

  const requests = [
    { id: '1', type: '1099-INT', status: 'pending', dueDate: '2025-03-15', priority: 'high' },
    { id: '2', type: 'Property Tax Statement', status: 'pending', dueDate: '2025-03-20', priority: 'normal' },
  ]

  const messages = [
    { id: '1', from: 'You', preview: 'Please upload your W-2 forms', date: '2 hours ago', unread: false },
    { id: '2', from: 'John Doe', preview: 'I have uploaded the documents', date: '1 day ago', unread: true },
    { id: '3', from: 'You', preview: 'Thank you, reviewing now', date: '2 days ago', unread: false },
  ]

  const activity = [
    { id: '1', action: 'Uploaded document', details: 'W2_ABC_Company.pdf', time: '2 hours ago' },
    { id: '2', action: 'Sent message', details: 'Please upload your W-2 forms', time: '1 day ago' },
    { id: '3', action: 'Status updated', details: 'Changed to In Progress', time: '3 days ago' },
    { id: '4', action: 'Document requested', details: '1099-INT form', time: '1 week ago' },
  ]

  // Document management functions
  const filteredItems = folderItems
    .filter(item => item.parentId === currentFolderId)
    .filter(item => searchQuery === '' || item.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (a.type === 'folder' && b.type === 'file') return -1
    if (a.type === 'file' && b.type === 'folder') return 1
    return a.name.localeCompare(b.name)
  })

  const getBreadcrumbs = () => {
    const breadcrumbs: { id: string | null; name: string }[] = [{ id: null, name: 'Documents' }]
    let currentId = currentFolderId
    const path: { id: string; name: string }[] = []

    while (currentId) {
      const folder = folderItems.find(item => item.id === currentId)
      if (folder) {
        path.unshift({ id: folder.id, name: folder.name })
        currentId = folder.parentId
      } else {
        break
      }
    }

    return [...breadcrumbs, ...path]
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

    const currentFolder = currentFolderId ? folderItems.find(i => i.id === currentFolderId) : null
    const parentPath = currentFolder?.path || ''

    const newFolder: FolderItem = {
      id: `folder-${Date.now()}`,
      name: newFolderName,
      type: 'folder',
      parentId: currentFolderId,
      path: parentPath ? `${parentPath}/${newFolderName}` : `/${newFolderName}`,
    }

    setFolderItems([...folderItems, newFolder])
    setNewFolderName('')
    setCreateFolderDialogOpen(false)
  }

  const handleDeleteItem = (itemId: string) => {
    setFolderItems(folderItems.filter(item => item.id !== itemId))
  }

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (item: FolderItem) => {
    if (item.type === 'folder') return '📁'
    if (item.fileType?.includes('pdf')) return '📄'
    if (item.fileType?.includes('image')) return '🖼️'
    if (item.fileType?.includes('spreadsheet') || item.name.endsWith('.xlsx') || item.name.endsWith('.xls')) return '📊'
    if (item.fileType?.includes('document') || item.name.endsWith('.docx') || item.name.endsWith('.doc')) return '📝'
    return '📎'
  }

  const allFiles = folderItems.filter(i => i.type === 'file')
  const selectedFile = allFiles.find(f => f.id === selectedFileId)
  const previewFile = selectedFile
    ? {
        id: selectedFile.id,
        name: selectedFile.name,
        type: selectedFile.fileType || 'application/octet-stream',
        url: `/mock-file-url/${selectedFile.id}`,
        size: selectedFile.size || 0,
        uploadedAt: selectedFile.uploadedAt,
        tags: selectedFile.tags,
      }
    : null

  const previewFiles = allFiles.map(f => ({
    id: f.id,
    name: f.name,
    type: f.fileType || 'application/octet-stream',
    url: `/mock-file-url/${f.id}`,
    size: f.size || 0,
    uploadedAt: f.uploadedAt,
    tags: f.tags,
  }))

  const statusColors: Record<string, string> = {
    in_progress: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    documents_pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    ready_for_review: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    filed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    complete: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/tax-pro/clients">
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
                    In Progress
                  </Badge>
                  <Badge variant="outline">Tax Year {client.taxYear}</Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/tax-pro/messages?client=${client.id}`}>
                <Button>
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Message
                </Button>
              </Link>
              <Button variant="outline">Edit</Button>
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
            <div className="text-2xl font-bold mt-1">{allFiles.length}</div>
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
          <TabsTrigger value="documents">Documents ({allFiles.length})</TabsTrigger>
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
                    In Progress
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
              <Button onClick={() => setCreateFolderDialogOpen(true)} size="sm">
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                New Folder
              </Button>
              <Button variant="outline" size="sm">
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload Files
              </Button>
            </div>
            <div className="flex items-center gap-1 border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
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
              <div className="flex items-center gap-2 flex-wrap">
                {getBreadcrumbs().map((crumb, index) => (
                  <div key={crumb.id || 'root'} className="flex items-center gap-2">
                    {index > 0 && <span className="text-muted-foreground">/</span>}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentFolderId(crumb.id)}
                      className={crumb.id === currentFolderId || (crumb.id === null && currentFolderId === null) ? 'bg-muted' : ''}
                    >
                      {crumb.name}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Search Bar */}
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
              placeholder="Search documents..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Files and Folders Display */}
          <Card>
            <CardHeader>
              <CardTitle>
                {currentFolderId ? folderItems.find(i => i.id === currentFolderId)?.name : 'All Documents'}
              </CardTitle>
              <CardDescription>
                {sortedItems.length} {sortedItems.length === 1 ? 'item' : 'items'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sortedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="text-6xl mb-4">📁</div>
                  <h3 className="text-lg font-semibold mb-2">
                    {searchQuery ? 'No items found' : 'This folder is empty'}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    {searchQuery ? 'Try adjusting your search' : 'Create a folder or upload files to get started'}
                  </p>
                  {!searchQuery && (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setCreateFolderDialogOpen(true)}>Create Folder</Button>
                      <Button>Upload Files</Button>
                    </div>
                  )}
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {sortedItems.map((item) => (
                    <div
                      key={item.id}
                      className="group relative border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                      onDoubleClick={() => handleItemDoubleClick(item)}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
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
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteItem(item.id)
                            }}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <div className="flex flex-col items-center text-center">
                        <div className="text-5xl mb-2">{getFileIcon(item)}</div>
                        <p className="font-medium text-sm truncate w-full" title={item.name}>{item.name}</p>
                        {item.type === 'file' ? (
                          <>
                            <p className="text-xs text-muted-foreground">{formatFileSize(item.size)}</p>
                            {item.status && (
                              <Badge
                                variant="outline"
                                className={`text-xs mt-1 ${
                                  item.status === 'reviewed'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20'
                                }`}
                              >
                                {item.status}
                              </Badge>
                            )}
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            {folderItems.filter(i => i.parentId === item.id).length} items
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
                      className="group flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onDoubleClick={() => handleItemDoubleClick(item)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="text-2xl flex-shrink-0">{getFileIcon(item)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {item.type === 'file' ? (
                              <>
                                <span>{formatFileSize(item.size)}</span>
                                {item.uploadedAt && (
                                  <>
                                    <span>•</span>
                                    <span>{item.uploadedAt}</span>
                                  </>
                                )}
                              </>
                            ) : (
                              <span>{folderItems.filter(i => i.parentId === item.id).length} items</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.type === 'file' && item.status && (
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              item.status === 'reviewed'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20'
                            }`}
                          >
                            {item.status}
                          </Badge>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
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
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteItem(item.id)
                              }}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
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
                <Button size="sm">New Request</Button>
              </div>
              <CardDescription>Outstanding document requests for this client</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {requests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{req.type}</p>
                        <Badge variant={req.priority === 'high' ? 'destructive' : 'secondary'}>
                          {req.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Due: {req.dueDate}</p>
                    </div>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20">
                      {req.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Message History</CardTitle>
                <Link href={`/tax-pro/messages?client=${client.id}`}>
                  <Button size="sm">View Full Conversation</Button>
                </Link>
              </div>
              <CardDescription>Recent messages with this client</CardDescription>
            </CardHeader>
            <CardContent>
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
                      <p className="text-sm text-muted-foreground">{msg.preview}</p>
                    </div>
                    {msg.unread && (
                      <Badge variant="default" className="h-5 px-2">New</Badge>
                    )}
                  </div>
                ))}
              </div>
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
              Create a new folder in {currentFolderId ? folderItems.find(i => i.id === currentFolderId)?.name : 'Documents'}
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
        file={previewFile}
        files={previewFiles}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onNavigate={(fileId) => setSelectedFileId(fileId)}
      />
    </div>
  )
}
