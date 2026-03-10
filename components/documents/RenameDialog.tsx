'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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

interface RenameDialogProps {
  open: boolean
  itemToRename: FolderItem | null
  newName: string
  onNameChange: (name: string) => void
  loading: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function RenameDialog({
  open,
  itemToRename,
  newName,
  onNameChange,
  loading,
  onConfirm,
  onCancel,
}: RenameDialogProps) {
  if (!open) return null

  return (
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
            onClick={onCancel}
            disabled={loading}
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
              onChange={(e) => onNameChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && onConfirm()}
              disabled={loading}
              autoFocus
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={loading || !newName.trim()}
            >
              {loading ? (
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
  )
}
