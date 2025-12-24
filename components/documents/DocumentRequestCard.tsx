'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FilePreview } from '@/components/files/FilePreview'

interface DocumentRequest {
  id: string
  documentType: string
  description: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  dueDate: string
  status: 'pending' | 'uploaded' | 'approved' | 'rejected' | 'cancelled'
  requestedAt: string
  notes?: string
  taxProName?: string
  uploadedFileName?: string
  uploadedAt?: string
  uploadedFileUrl?: string
  uploadedFileType?: string
  uploadedFileSize?: number
}

interface DocumentRequestCardProps {
  request: DocumentRequest
  onUpload: (requestId: string, file: File, notes: string) => Promise<void>
}

export function DocumentRequestCard({ request, onUpload }: DocumentRequestCardProps) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [clientNotes, setClientNotes] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewOpen, setPreviewOpen] = useState(false)

  const priorityConfig = {
    low: {
      badge: 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-400',
      label: 'Low Priority',
      icon: '📋',
    },
    normal: {
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      label: 'Normal',
      icon: '📄',
    },
    high: {
      badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      label: 'High Priority',
      icon: '⚡',
    },
    urgent: {
      badge: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      label: 'Urgent',
      icon: '🚨',
    },
  }

  const statusConfig = {
    pending: {
      badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      label: 'Pending',
      icon: '⏳',
    },
    uploaded: {
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      label: 'Uploaded',
      icon: '📤',
    },
    approved: {
      badge: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      label: 'Approved',
      icon: '✅',
    },
    rejected: {
      badge: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      label: 'Needs Revision',
      icon: '❌',
    },
      cancelled: { 
      badge: "bg-gray-100 text-gray-800",
      label: "Cancelled",
      icon: "🚫"
    }
  }

  const getDaysUntilDue = () => {
    const due = new Date(request.dueDate)
    const now = new Date()
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysUntilDue = getDaysUntilDue()
  const isOverdue = daysUntilDue < 0
  const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 3

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      await onUpload(request.id, selectedFile, clientNotes)

      clearInterval(interval)
      setUploadProgress(100)

      // Close dialog after brief success display
      setTimeout(() => {
        setUploadDialogOpen(false)
        setSelectedFile(null)
        setClientNotes('')
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
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const config = priorityConfig[request.priority]
  const statusInfo = statusConfig[request.status]

  return (
    <>
      <Card
        className={`transition-all hover:shadow-lg ${
          request.status === 'pending' && isDueSoon
            ? 'border-orange-300 dark:border-orange-700'
            : request.status === 'pending' && isOverdue
            ? 'border-red-300 dark:border-red-700'
            : ''
        }`}
      >
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{config.icon}</span>
                <CardTitle className="text-xl">{request.documentType}</CardTitle>
              </div>
              <CardDescription>
                Requested by {request.taxProName} •{' '}
                {new Date(request.requestedAt).toLocaleDateString()}
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant="outline" className={statusInfo.badge}>
                {statusInfo.icon} {statusInfo.label}
              </Badge>
              <Badge variant="outline" className={config.badge}>
                {config.label}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Description */}
          <div>
            <h4 className="font-semibold mb-1 text-sm">What we need:</h4>
            <p className="text-sm text-muted-foreground">{request.description}</p>
          </div>

          {/* Notes from tax pro */}
          {request.notes && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <h4 className="font-semibold mb-1 text-sm flex items-center gap-2">
                <span>💡</span>
                Additional Instructions:
              </h4>
              <p className="text-sm text-muted-foreground">{request.notes}</p>
            </div>
          )}

          {/* Due Date */}
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium">Due Date</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(request.dueDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <div className="text-right">
              {isOverdue ? (
                <Badge variant="destructive">Overdue by {Math.abs(daysUntilDue)} days</Badge>
              ) : isDueSoon ? (
                <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/20">
                  Due in {daysUntilDue} {daysUntilDue === 1 ? 'day' : 'days'}
                </Badge>
              ) : (
                <Badge variant="secondary">
                  {daysUntilDue} {daysUntilDue === 1 ? 'day' : 'days'} remaining
                </Badge>
              )}
            </div>
          </div>

          {/* Upload Status / Button */}
          {request.status === 'pending' || request.status === 'rejected' ? (
            <Button
              onClick={() => setUploadDialogOpen(true)}
              className="w-full"
              size="lg"
              variant={isOverdue || isDueSoon ? 'default' : 'default'}
            >
              <svg
                className="h-5 w-5 mr-2"
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
              {request.status === 'rejected' ? 'Upload Revised Document' : 'Upload Document'}
            </Button>
          ) : request.status === 'uploaded' ? (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📤</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">Document Uploaded</p>
                  <p className="text-sm text-muted-foreground truncate">{request.uploadedFileName}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Uploaded {new Date(request.uploadedAt!).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 flex-shrink-0">
                  Under Review
                </Badge>
              </div>
              {request.uploadedFileUrl && (
                <Button
                  onClick={() => setPreviewOpen(true)}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  View Document
                </Button>
              )}
            </div>
          ) : request.status === 'approved' ? (
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">Document Approved</p>
                  <p className="text-sm text-muted-foreground truncate">{request.uploadedFileName}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Approved {new Date(request.uploadedAt!).toLocaleDateString()}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="bg-green-100 text-green-800 dark:bg-green-900/20 flex-shrink-0"
                >
                  Complete
                </Badge>
              </div>
              {request.uploadedFileUrl && (
                <Button
                  onClick={() => setPreviewOpen(true)}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  View Document
                </Button>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Upload {request.documentType}</DialogTitle>
            <DialogDescription>{request.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* File Upload */}
            <div>
              <label className="text-sm font-medium mb-2 block">Select File</label>
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 text-center hover:border-primary transition-colors">
                <input
                  type="file"
                  id="file-upload-request"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                  disabled={uploading}
                />
                <label
                  htmlFor="file-upload-request"
                  className="cursor-pointer flex flex-col items-center"
                >
                  {selectedFile ? (
                    <>
                      <div className="text-4xl mb-2">📄</div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(selectedFile.size)}
                      </p>
                      <Button variant="link" className="mt-2" type="button">
                        Choose different file
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="text-4xl mb-2">📁</div>
                      <p className="font-medium">Click to browse files</p>
                      <p className="text-sm text-muted-foreground">
                        PDF, JPG, PNG, DOC, DOCX, XLS, XLSX
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Optional Notes */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Notes (Optional)
              </label>
              <Textarea
                placeholder="Add any notes about this document..."
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
                rows={3}
                disabled={uploading}
              />
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-sm text-center text-muted-foreground">
                  {uploadProgress === 100 ? 'Upload complete! ✓' : `Uploading... ${uploadProgress}%`}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUploadDialogOpen(false)
                setSelectedFile(null)
                setClientNotes('')
              }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
              {uploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Preview Modal */}
      {request.uploadedFileUrl && (
        <FilePreview
          file={{
            id: request.id,
            name: request.uploadedFileName || 'document',
            type: request.uploadedFileType || 'application/pdf',
            url: request.uploadedFileUrl,
            size: request.uploadedFileSize || 0,
            uploadedAt: request.uploadedAt,
          }}
          open={previewOpen}
          onOpenChange={setPreviewOpen}
        />
      )}
    </>
  )
}
