'use client'

import { Button } from '@/components/ui/button'

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

interface DeleteConfirmDialogProps {
  open: boolean
  itemToDelete: FolderItem | null
  loading: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function DeleteConfirmDialog({
  open,
  itemToDelete,
  loading,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  if (!open) return null

  return (
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
            onClick={onCancel}
            disabled={loading}
          >
            No
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
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
  )
}
