'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useState } from 'react'

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

interface MoveDialogProps {
  open: boolean
  itemToMove: FolderItem | null
  availableFolders: FolderItem[]
  currentPath: string
  loading: boolean
  onConfirm: (destinationFolder: FolderItem | null) => void
  onCancel: () => void
}

export default function MoveDialog({
  open,
  itemToMove,
  availableFolders,
  currentPath,
  loading,
  onConfirm,
  onCancel,
}: MoveDialogProps) {
  const [selectedFolder, setSelectedFolder] = useState<FolderItem | null>(null)

  console.log('📦 MOVE DIALOG RENDER:')
  console.log('  open:', open)
  console.log('  itemToMove:', itemToMove?.name)
  console.log('  availableFolders count:', availableFolders.length)
  console.log('  availableFolders:', availableFolders)

  if (!open) return null

  // Filter out the current item if it's a folder (can't move folder into itself)
  const validFolders = availableFolders.filter(folder => {
    // Can't move into itself
    if (itemToMove && folder.id === itemToMove.id) return false
    // Can't move into a folder that's inside the item being moved
    if (itemToMove?.type === 'FOLDER' && folder.path.startsWith(itemToMove.path + '/')) return false
    return true
  })

  console.log('  validFolders count:', validFolders.length)

  const handleConfirm = () => {
    onConfirm(selectedFolder)
    setSelectedFolder(null)
  }

  const handleCancel = () => {
    onCancel()
    setSelectedFolder(null)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Move {itemToMove?.type === 'FOLDER' ? 'Folder' : 'File'}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleCancel}
            disabled={loading}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Moving: <span className="font-semibold">{itemToMove?.name}</span></Label>
            <p className="text-sm text-muted-foreground">Select destination folder:</p>
          </div>

          <ScrollArea className="h-64 w-full border rounded-md p-2">
            <div className="space-y-1">
              {/* Option to move to root */}
              {currentPath !== '/' && (
                <button
                  onClick={() => setSelectedFolder(null)}
                  className={`w-full text-left p-3 rounded-md transition-colors ${
                    selectedFolder === null
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📁</span>
                    <span className="font-medium">My Documents (Root)</span>
                  </div>
                </button>
              )}

              {validFolders.length === 0 && currentPath === '/' ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No folders available.</p>
                  <p className="text-sm mt-1">Create a folder first to move items into it.</p>
                </div>
              ) : (
                validFolders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolder(folder)}
                    className={`w-full text-left p-3 rounded-md transition-colors ${
                      selectedFolder?.id === folder.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📁</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{folder.name}</p>
                        <p className="text-xs opacity-70 truncate">{folder.path}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={loading || (selectedFolder === null && currentPath === '/')}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Moving...
                </>
              ) : (
                'Move Here'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
