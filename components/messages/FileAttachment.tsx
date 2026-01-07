'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  isValidFileType,
  isImageFile,
  getFileDisplayName,
  formatFileSize,
  MAX_FILE_SIZE,
} from '@/lib/storage/fileUpload'

interface FileAttachmentProps {
  onFileSelect: (file: File) => void
  onRemove: () => void
  disabled?: boolean
}

export interface FilePreview {
  file: File
  preview?: string
  uploading: boolean
  progress: number
  error?: string
}

export default function FileAttachment({
  onFileSelect,
  onRemove,
  disabled = false,
}: FileAttachmentProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!isValidFileType(file)) {
      alert('Invalid file type. Allowed: PNG, JPEG, PDF, Word, Excel')
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      alert('File size exceeds 10MB limit')
      return
    }

    onFileSelect(file)

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.pdf,.doc,.docx,.xls,.xlsx"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
      <Button
        variant="outline"
        size="icon"
        title="Attach file"
        onClick={handleFileClick}
        disabled={disabled}
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
            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
          />
        </svg>
      </Button>
    </>
  )
}

interface FilePreviewCardProps {
  filePreview: FilePreview
  onRemove: () => void
}

export function FilePreviewCard({ filePreview, onRemove }: FilePreviewCardProps) {
  const { file, preview, uploading, progress, error } = filePreview
  const isImage = isImageFile(file)

  return (
    <Card className="p-3 mb-3">
      <div className="flex items-start gap-3">
        {/* File Preview/Icon */}
        <div className="flex-shrink-0">
          {isImage && preview ? (
            <div className="relative w-16 h-16 rounded overflow-hidden bg-slate-100 dark:bg-slate-800">
              <img
                src={preview}
                alt={file.name}
                className="w-full h-full object-cover"
              />
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <svg
                    className="h-6 w-6 animate-spin text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </div>
              )}
            </div>
          ) : (
            <div className="w-16 h-16 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <svg
                className="h-8 w-8 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{getFileDisplayName(file.name)}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>

          {/* Progress Bar */}
          {uploading && (
            <div className="mt-2">
              <Progress value={progress} className="h-1.5" />
              <p className="text-xs text-muted-foreground mt-1">{progress}% uploaded</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <p className="text-xs text-red-500 mt-1">{error}</p>
          )}
        </div>

        {/* Remove Button */}
        {!uploading && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="flex-shrink-0 h-8 w-8"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Button>
        )}
      </div>
    </Card>
  )
}
