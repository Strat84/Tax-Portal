/**
 * DeleteConfirmDialog component - confirmation dialog for deleting files/folders
 */

'use client'

import { Button } from '@/components/ui/button'

interface FolderItem {
  name: string
  type: 'FILE' | 'FOLDER'
  id: string
}

interface DeleteConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: FolderItem | null
  onConfirm: () => Promise<void>
  isLoading: boolean
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  item,
  onConfirm,
  isLoading,
}: DeleteConfirmDialogProps) {
  if (!open || !item) return null

  const handleConfirm = async () => {
    await onConfirm()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-xl flex flex-col items-center gap-4 max-w-md w-full mx-4">
        {/* Warning Icon */}
        <div className="text-6xl mb-2">⚠️</div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 text-center">
          Are you sure?
        </h3>

        {/* Message */}
        <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
          Do you want to delete <strong>"{item.name}"</strong>? This action cannot
          be undone.
        </p>

        {/* Actions */}
        <div className="flex gap-3 w-full mt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            No
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Yes, Delete'}
          </Button>
        </div>
      </div>
    </div>
  )
}
