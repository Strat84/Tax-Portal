/**
 * DocumentsTab component - main documents/files section
 */

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FileGridView } from './FileGridView'
import { FileListView } from './FileListView'
import { BreadcrumbNavigation, type Breadcrumb } from './BreadcrumbNavigation'
import { FileUploadDialog } from './FileUploadDialog'
import { CreateFolderDialog } from './CreateFolderDialog'
import { RenameItemDialog } from './RenameItemDialog'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'

interface FolderItem {
  name: string
  type: 'FILE' | 'FOLDER'
  id: string
  size: number
  totalFiles?: number
}


interface DocumentsTabProps {
  items: FolderItem[]
  loading: boolean
  searchQuery: string
  onSearchChange: (query: string) => void
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
  breadcrumbs: Breadcrumb[]
  onNavigate: (segments: string[]) => void
  currentPath: string
  currentPathForApi: string
  userId: string
  // Upload
  uploadOpen: boolean
  onUploadOpenChange: (open: boolean) => void
  onUploadComplete?: () => void
  // Create Folder
  createFolderOpen: boolean
  onCreateFolderOpenChange: (open: boolean) => void
  newFolderName: string
  onFolderNameChange: (name: string) => void
  onCreateFolder: () => Promise<void>
  creatingFolder?: boolean
  // File operations
  onItemDoubleClick: (item: FolderItem) => void
  onRename: (item: FolderItem) => void
  onDelete: (item: FolderItem) => void
  // Rename Dialog
  renameOpen: boolean
  onRenameOpenChange: (open: boolean) => void
  itemToRename: FolderItem | null
  newName: string
  onNameChange: (name: string) => void
  onConfirmRename: () => Promise<void>
  updatingFile?: boolean
  // Delete Dialog
  deleteOpen: boolean
  onDeleteOpenChange: (open: boolean) => void
  itemToDelete: FolderItem | null
  onConfirmDelete: () => Promise<void>
  deletingFile?: boolean
  // Errors
  error?: string
  isSearching?: boolean
}

function getFolderName(path: string): string {
  if (path === '/') return 'All Documents'
  const lastSegment = path.split('/').filter(Boolean).pop()
  return lastSegment || 'All Documents'
}

export function DocumentsTab({
  items,
  loading,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  breadcrumbs,
  onNavigate,
  currentPath,
  currentPathForApi,
  userId,
  uploadOpen,
  onUploadOpenChange,
  onUploadComplete,
  createFolderOpen,
  onCreateFolderOpenChange,
  newFolderName,
  onFolderNameChange,
  onCreateFolder,
  creatingFolder = false,
  onItemDoubleClick,
  onRename,
  onDelete,
  renameOpen,
  onRenameOpenChange,
  itemToRename,
  newName,
  onNameChange,
  onConfirmRename,
  updatingFile = false,
  deleteOpen,
  onDeleteOpenChange,
  itemToDelete,
  onConfirmDelete,
  deletingFile = false,
  error,
  isSearching = false,
}: DocumentsTabProps) {
  const currentFolderName = getFolderName(currentPath)

  return (
    <div className="space-y-4">
      {/* Document Controls - New Folder & Upload */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCreateFolderOpenChange(true)}
          >
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
                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
            New Folder
          </Button>

          <Button
            size="sm"
            onClick={() => onUploadOpenChange(true)}
          >
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
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 border rounded-md">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
          >
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
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('list')}
          >
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
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </Button>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <BreadcrumbNavigation breadcrumbs={breadcrumbs} onNavigate={onNavigate} />

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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <Input
              placeholder="Search files and folders..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Files and Folders Display */}
      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-muted-foreground">Loading files...</p>
            </div>
          ) : items.length === 0 ? (
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
                  <Button onClick={() => onCreateFolderOpenChange(true)}>
                    Create Folder
                  </Button>
                  <Button
                    onClick={() => onUploadOpenChange(true)}
                    variant="outline"
                  >
                    Upload Files
                  </Button>
                </div>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <FileGridView
              items={items}
              onItemDoubleClick={onItemDoubleClick}
              onRename={onRename}
              onDelete={onDelete}
            />
          ) : (
            <FileListView
              items={items}
              onItemDoubleClick={onItemDoubleClick}
              onRename={onRename}
              onDelete={onDelete}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <FileUploadDialog
        open={uploadOpen}
        onOpenChange={onUploadOpenChange}
        userId={userId}
        parentPath={currentPathForApi}
        folderName={currentFolderName}
        onUploadComplete={onUploadComplete}
        maxFiles={5}
      />

      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={onCreateFolderOpenChange}
        folderName={newFolderName}
        onFolderNameChange={onFolderNameChange}
        onSubmit={onCreateFolder}
        isLoading={creatingFolder}
        folderLocation={currentFolderName}
      />

      <RenameItemDialog
        open={renameOpen}
        onOpenChange={onRenameOpenChange}
        item={itemToRename}
        newName={newName}
        onNameChange={onNameChange}
        onSubmit={onConfirmRename}
        isLoading={updatingFile}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={onDeleteOpenChange}
        item={itemToDelete}
        onConfirm={onConfirmDelete}
        isLoading={deletingFile}
      />
    </div>
  )
}
