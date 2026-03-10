/**
 * FileUploadDialog component - dialog for uploading files
 */

'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FileUpload } from '@/components/files/FileUpload'

interface FileUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  parentPath: string
  folderName: string
  onUploadComplete?: () => void
  maxFiles?: number
}

export function FileUploadDialog({
  open,
  onOpenChange,
  userId,
  parentPath,
  folderName,
  onUploadComplete,
  maxFiles = 5,
}: FileUploadDialogProps) {
  const handleUploadComplete = () => {
    if (onUploadComplete) {
      onUploadComplete()
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
          <DialogDescription>Upload files to {folderName}</DialogDescription>
        </DialogHeader>

        <FileUpload
          userId={userId}
          parentPath={parentPath}
          onUploadComplete={handleUploadComplete}
          maxFiles={maxFiles}
        />
      </DialogContent>
    </Dialog>
  )
}
