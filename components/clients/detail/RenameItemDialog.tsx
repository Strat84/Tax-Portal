/**
 * RenameItemDialog component - dialog for renaming files/folders
 */

'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface FolderItem {
  name: string
  type: 'FILE' | 'FOLDER'
  id: string
  size: number
  totalFiles?: number
  uploadedAt?: string
}

interface RenameItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: FolderItem | null
  newName: string
  onNameChange: (name: string) => void
  onSubmit: () => Promise<void>
  isLoading: boolean
}

export function RenameItemDialog({
  open,
  onOpenChange,
  item,
  newName,
  onNameChange,
  onSubmit,
  isLoading,
}: RenameItemDialogProps) {
  if (!open || !item) return null

  const handleSubmit = async () => {
    await onSubmit()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Rename {item.type === 'FOLDER' ? 'Folder' : 'File'}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rename-input">New Name</Label>
            <Input
              id="rename-input"
              placeholder="Enter new name"
              value={newName}
              onChange={(e) => onNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isLoading && newName.trim()) {
                  handleSubmit()
                }
              }}
              disabled={isLoading}
              autoFocus
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !newName.trim()}
            >
              {isLoading ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
