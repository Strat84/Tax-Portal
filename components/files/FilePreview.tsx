'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'

interface FilePreviewFile {
  id: string
  name: string
  type: string
  url: string
  size: number
  uploadedAt?: string
  tags?: string[]
}

interface FilePreviewProps {
  file: FilePreviewFile | null
  files?: FilePreviewFile[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate?: (fileId: string) => void
}

export function FilePreview({ file, files = [], open, onOpenChange, onNavigate }: FilePreviewProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)

  useEffect(() => {
    if (file) {
      setLoading(true)
      setError(null)
      setZoom(100)
      // Simulate loading
      setTimeout(() => setLoading(false), 500)
    }
  }, [file])

  if (!file) return null

  const currentIndex = files.findIndex(f => f.id === file.id)
  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < files.length - 1

  const handlePrevious = () => {
    if (hasPrevious && onNavigate) {
      onNavigate(files[currentIndex - 1].id)
    }
  }

  const handleNext = () => {
    if (hasNext && onNavigate) {
      onNavigate(files[currentIndex + 1].id)
    }
  }

  // Keyboard navigation
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && hasPrevious && onNavigate) {
        e.preventDefault()
        handlePrevious()
      } else if (e.key === 'ArrowRight' && hasNext && onNavigate) {
        e.preventDefault()
        handleNext()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onOpenChange(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, hasPrevious, hasNext, onNavigate, onOpenChange, handlePrevious, handleNext])

  const handleDownload = () => {
    // TODO: Implement actual download from Supabase Storage
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.name
    link.click()
  }

  const handlePrint = () => {
    // TODO: Implement print functionality
    window.print()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (type: string, name: string) => {
    if (type.startsWith('image/')) return '🖼️'
    if (type === 'application/pdf') return '📄'
    if (type.includes('spreadsheet') || name.endsWith('.xlsx') || name.endsWith('.xls')) return '📊'
    if (type.includes('document') || name.endsWith('.docx') || name.endsWith('.doc')) return '📝'
    return '📎'
  }

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-[600px] bg-slate-50 dark:bg-slate-900">
          <div className="text-4xl mb-4">📄</div>
          <p className="text-muted-foreground mb-4">Loading preview...</p>
          <Progress value={66} className="w-48" />
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-[600px] bg-slate-50 dark:bg-slate-900">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="font-semibold mb-2">Unable to preview file</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleDownload}>Download File</Button>
        </div>
      )
    }

    // PDF Preview
    if (file.type === 'application/pdf') {
      return (
        <div className="bg-slate-50 dark:bg-slate-900 h-[600px] overflow-auto">
          <iframe
            src={file.url}
            className="w-full h-full"
            title={file.name}
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          />
        </div>
      )
    }

    // Image Preview
    if (file.type.startsWith('image/')) {
      return (
        <div className="bg-slate-50 dark:bg-slate-900 h-[600px] flex items-center justify-center overflow-auto">
          <img
            src={file.url}
            alt={file.name}
            className="max-w-full max-h-full object-contain"
            style={{ transform: `scale(${zoom / 100})` }}
          />
        </div>
      )
    }

    // Spreadsheet Preview
    if (file.type.includes('spreadsheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      return (
        <div className="flex flex-col items-center justify-center h-[600px] bg-slate-50 dark:bg-slate-900">
          <div className="text-6xl mb-4">📊</div>
          <p className="font-semibold mb-2">Spreadsheet File</p>
          <p className="text-sm text-muted-foreground mb-4">
            Preview not available for Excel files
          </p>
          <Button onClick={handleDownload}>Download to View</Button>
        </div>
      )
    }

    // Document Preview
    if (file.type.includes('document') || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
      return (
        <div className="flex flex-col items-center justify-center h-[600px] bg-slate-50 dark:bg-slate-900">
          <div className="text-6xl mb-4">📝</div>
          <p className="font-semibold mb-2">Word Document</p>
          <p className="text-sm text-muted-foreground mb-4">
            Preview not available for Word documents
          </p>
          <Button onClick={handleDownload}>Download to View</Button>
        </div>
      )
    }

    // Unsupported file type
    return (
      <div className="flex flex-col items-center justify-center h-[600px] bg-slate-50 dark:bg-slate-900">
        <div className="text-6xl mb-4">📎</div>
        <p className="font-semibold mb-2">Preview Not Available</p>
        <p className="text-sm text-muted-foreground mb-4">
          This file type cannot be previewed in the browser
        </p>
        <Button onClick={handleDownload}>Download File</Button>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <span className="text-3xl flex-shrink-0">{getFileIcon(file.type, file.name)}</span>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg truncate">{file.name}</DialogTitle>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-sm text-muted-foreground">
                    {formatFileSize(file.size)}
                  </span>
                  {file.uploadedAt && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(file.uploadedAt).toLocaleDateString()}
                      </span>
                    </>
                  )}
                  {files.length > 1 && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">
                        {currentIndex + 1} of {files.length}
                      </span>
                    </>
                  )}
                </div>
                {file.tags && file.tags.length > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    {file.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b flex items-center justify-between gap-4 flex-shrink-0 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            {/* Navigation */}
            {files.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={!hasPrevious}
                >
                  <svg
                    className="h-4 w-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={!hasNext}
                >
                  Next
                  <svg
                    className="h-4 w-4 ml-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Button>
                <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 mx-1" />
              </>
            )}

            {/* Zoom Controls for images and PDFs */}
            {(file.type.startsWith('image/') || file.type === 'application/pdf') && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.max(25, zoom - 25))}
                  disabled={zoom <= 25}
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
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
                    />
                  </svg>
                </Button>
                <span className="text-sm font-medium min-w-[60px] text-center">
                  {zoom}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.min(200, zoom + 25))}
                  disabled={zoom >= 200}
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
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                    />
                  </svg>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(100)}
                >
                  Reset
                </Button>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <svg
                className="h-4 w-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download
            </Button>
            {file.type === 'application/pdf' && (
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <svg
                  className="h-4 w-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                Print
              </Button>
            )}
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-hidden">
          {renderPreview()}
        </div>

        {/* Keyboard Shortcuts Hint */}
        {files.length > 1 && (
          <div className="px-6 py-2 border-t bg-slate-50 dark:bg-slate-900 text-xs text-muted-foreground flex items-center justify-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded">←</kbd>
              Previous
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded">→</kbd>
              Next
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded">Esc</kbd>
              Close
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
