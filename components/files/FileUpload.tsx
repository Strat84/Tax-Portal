'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

interface FileUploadProps {
  onUpload?: (files: File[]) => Promise<void>
  accept?: string
  maxSize?: number // in MB
  multiple?: boolean
}

export function FileUpload({
  onUpload,
  accept = '*',
  maxSize = 50,
  multiple = true
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

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
      setSelectedFiles(prev => multiple ? [...prev, ...validFiles] : [validFiles[0]])
    }
  }, [multiple, maxSize])

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
      setSelectedFiles(prev => multiple ? [...prev, ...validFiles] : [validFiles[0]])
    }
  }

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !onUpload) return

    setUploading(true)
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      await onUpload(selectedFiles)

      clearInterval(interval)
      setUploadProgress(100)

      // Clear files after successful upload
      setTimeout(() => {
        setSelectedFiles([])
        setUploadProgress(0)
        setUploading(false)
      }, 1000)
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Please try again.')
      setUploading(false)
      setUploadProgress(0)
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
            Maximum file size: {maxSize}MB. Executable files are not allowed.
          </p>
        </div>
      </Card>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold">
              Selected Files ({selectedFiles.length})
            </h4>
            <Button
              onClick={handleUpload}
              disabled={uploading}
              size="sm"
            >
              {uploading ? 'Uploading...' : 'Upload All'}
            </Button>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="mb-4">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1 text-center">
                {uploadProgress}% uploaded
              </p>
            </div>
          )}

          {/* File List */}
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg"
              >
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFile(index)}
                  disabled={uploading}
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
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
