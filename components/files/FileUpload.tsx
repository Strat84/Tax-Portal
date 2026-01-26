'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { uploadMultipleFilesToS3, UploadProgress } from '@/lib/storage/fileUpload'
import { useCreateFile } from '@/hooks/useFileQuery'

interface FileUploadProps {
  userId: string
  parentPath?: string | null
  onUploadComplete?: () => void
  accept?: string
  maxSize?: number // in MB
  multiple?: boolean
  maxFiles?: number
}

export function FileUpload({
  userId,
  parentPath = '/',
  onUploadComplete,
  accept = '*',
  maxSize = 50,
  multiple = true,
  maxFiles = 5
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [fileProgress, setFileProgress] = useState<{ [key: number]: UploadProgress }>({})

  // Use custom hook for creating file entries
  const { createFile } = useCreateFile()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const validateFile = (file: File): string | null => {
    const maxBytes = maxSize * 1024 * 1024
    if (file.size > maxBytes) {
      return `File size exceeds ${maxSize}MB limit`
    }

    // Check file extension for security
    const extension = file.name.split('.').pop()?.toLowerCase()
    const dangerousExtensions = ['exe', 'bat', 'cmd', 'sh', 'app', 'dmg', 'pkg', 'msi']
    if (extension && dangerousExtensions.includes(extension)) {
      return 'This file type is not allowed for security reasons'
    }

    return null
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const validFiles: File[] = []
    const errors: string[] = []

    files.forEach(file => {
      const error = validateFile(file)
      if (error) {
        errors.push(`${file.name}: ${error}`)
      } else {
        validFiles.push(file)
      }
    })

    if (errors.length > 0) {
      alert(errors.join('\n'))
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => {
        const newFiles = multiple ? [...prev, ...validFiles] : [validFiles[0]]
        // Limit to maxFiles
        if (newFiles.length > maxFiles) {
          alert(`You can only upload up to ${maxFiles} files at a time.`)
          return newFiles.slice(0, maxFiles)
        }
        return newFiles
      })
    }
  }, [multiple, maxSize, maxFiles])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles: File[] = []
    const errors: string[] = []

    files.forEach(file => {
      const error = validateFile(file)
      if (error) {
        errors.push(`${file.name}: ${error}`)
      } else {
        validFiles.push(file)
      }
    })

    if (errors.length > 0) {
      alert(errors.join('\n'))
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => {
        const newFiles = multiple ? [...prev, ...validFiles] : [validFiles[0]]
        // Limit to maxFiles
        if (newFiles.length > maxFiles) {
          alert(`You can only upload up to ${maxFiles} files at a time.`)
          return newFiles.slice(0, maxFiles)
        }
        return newFiles
      })
    }

    // Reset input value to allow re-uploading same file
    e.target.value = ''
  }

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    setUploading(true)
    setFileProgress({})

    try {
      // Upload files to S3 with individual progress tracking
      const uploadResults = await uploadMultipleFilesToS3(
        selectedFiles,
        userId,
        parentPath,
        (fileIndex, fileName, progress) => {
          setFileProgress(prev => ({
            ...prev,
            [fileIndex]: progress
          }))
        }
      )

      // Create database entries for each file via GraphQL hook
      for (const result of uploadResults) {
        // Clean parentPath for database entry
        const cleanParentPath = parentPath?.replace(/^\/+|\/+$/g, '') || '/'

        await createFile({
          type: result.type,
          name: result.name,
          fileType: result.fileType,
          s3Key: result.s3Key,
          parentPath: cleanParentPath,
          fullPath: result.fullPath,
          size: result.size,
          mimeType: result.mimeType,
        })
      }

      // Clear files after successful upload
      setTimeout(() => {
        setSelectedFiles([])
        setFileProgress({})
        setUploading(false)
        onUploadComplete?.()
      }, 1000)
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Please try again.')
      setUploading(false)
      setFileProgress({})
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-slate-300 dark:border-slate-700'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <svg
              className="h-8 w-8 text-slate-400"
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
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {isDragging ? 'Drop files here' : 'Drag and drop files here'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            or click to browse files
          </p>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileSelect}
            accept={accept}
            multiple={multiple}
            disabled={uploading}
          />
          <label htmlFor="file-upload">
            <Button asChild disabled={uploading}>
              <span>Browse Files</span>
            </Button>
          </label>
          <p className="text-xs text-muted-foreground mt-4">
            Maximum file size: {maxSize}MB. Up to {maxFiles} files allowed. Executable files are not allowed.
          </p>
        </div>
      </Card>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold">
              Selected Files ({selectedFiles.length}/{maxFiles})
            </h4>
            <Button
              onClick={handleUpload}
              disabled={uploading}
              size="sm"
            >
              {uploading ? 'Uploading...' : 'Upload All'}
            </Button>
          </div>

          {/* File List with Individual Progress */}
          <div className="space-y-3">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="border border-slate-200 dark:border-slate-700 rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {file.type.startsWith('image/') ? '🖼️' :
                       file.type === 'application/pdf' ? '📄' :
                       file.type.includes('spreadsheet') || file.name.endsWith('.xlsx') ? '📊' :
                       file.type.includes('document') || file.name.endsWith('.docx') ? '📝' : '📎'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  {!uploading && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(index)}
                      className="flex-shrink-0"
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

                {/* Individual File Progress */}
                {uploading && fileProgress[index] && (
                  <div className="mt-2">
                    <Progress value={fileProgress[index].percentage} className="h-1.5" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {fileProgress[index].percentage}% uploaded
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
