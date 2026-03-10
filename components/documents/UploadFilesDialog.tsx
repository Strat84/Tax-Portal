'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FileUpload } from '@/components/files/FileUpload'

interface UploadFilesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  parentPath: string
  onUploadComplete: () => void
  currentFolderName: string
  documentRequestId?: string
  documentRequestSK?: string
}

export default function UploadFilesDialog({
  open,
  onOpenChange,
  userId,
  parentPath,
  onUploadComplete,
  currentFolderName,
  documentRequestId,
  documentRequestSK,
}: UploadFilesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            Upload files to {currentFolderName}
          </DialogDescription>
        </DialogHeader>
        <FileUpload
          userId={userId}
          parentPath={parentPath}
          onUploadComplete={() => {
            onOpenChange(false)
            onUploadComplete()
          }}
          maxFiles={5}
          documentRequestId={documentRequestId}
          documentRequestSK={documentRequestSK}
        />
      </DialogContent>
    </Dialog>
  )
}
