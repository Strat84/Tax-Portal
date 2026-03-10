/**
 * CreateFolderDialog component - dialog for creating new folders
 */

'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CreateFolderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folderName: string
  onFolderNameChange: (name: string) => void
  onSubmit: () => Promise<void>
  isLoading: boolean
  folderLocation: string
}

export function CreateFolderDialog({
  open,
  onOpenChange,
  folderName,
  onFolderNameChange,
  onSubmit,
  isLoading,
  folderLocation,
}: CreateFolderDialogProps) {
  const handleSubmit = async () => {
    await onSubmit()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
          <DialogDescription>Create a new folder in {folderLocation}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input
              id="folder-name"
              placeholder="e.g., 2025 Receipts"
              value={folderName}
              onChange={(e) => onFolderNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isLoading && folderName.trim()) {
                  handleSubmit()
                }
              }}
              disabled={isLoading}
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !folderName.trim()}
          >
            {isLoading ? 'Creating...' : 'Create Folder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
