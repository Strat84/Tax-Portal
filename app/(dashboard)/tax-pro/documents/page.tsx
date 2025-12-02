'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FilePreview } from '@/components/files/FilePreview'
import { useAuth } from '@/contexts/AuthContext'
import { useTaxProDocuments } from '@/hooks/useTaxProDocuments'
import { getDocumentUrl } from '@/lib/api/documents'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function TaxProDocumentsPage() {
  const { user } = useAuth()
  const { documents: rawDocuments, loading, error } = useTaxProDocuments(user?.id || null)

  const [previewOpen, setPreviewOpen] = useState(false)
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [documentUrls, setDocumentUrls] = useState<Record<string, string>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClient, setSelectedClient] = useState('all-clients')

  // Fetch signed URLs for all documents
  useEffect(() => {
    const fetchUrls = async () => {
      if (!rawDocuments.length) return

      const urls: Record<string, string> = {}
      await Promise.all(
        rawDocuments.map(async (doc) => {
          try {
            const url = await getDocumentUrl(doc.path)
            urls[doc.id] = url
          } catch (err) {
            console.error(`Failed to fetch URL for ${doc.name}:`, err)
          }
        })
      )
      setDocumentUrls(urls)
    }

    fetchUrls()
  }, [rawDocuments])

  // Transform documents for display
  const documents = rawDocuments.map(doc => ({
    id: doc.id,
    fileName: doc.name,
    client: doc.clientName,
    clientId: doc.clientId,
    type: doc.type.includes('pdf') ? 'PDF' : doc.type.includes('image') ? 'Image' : 'Document',
    size: formatFileSize(doc.size),
    sizeBytes: doc.size,
    fileType: doc.type,
    url: documentUrls[doc.id] || '',
    uploadedAt: new Date(doc.uploadedAt).toLocaleDateString(),
    status: 'reviewed', // TODO: Implement document review status
    tags: doc.tags || [],
  }))

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.client.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesClient = selectedClient === 'all-clients' || doc.clientId === selectedClient
    return matchesSearch && matchesClient
  })

  // Get unique clients for filter
  const uniqueClients = Array.from(new Set(rawDocuments.map(d => d.clientId)))
    .map(id => {
      const doc = rawDocuments.find(d => d.clientId === id)
      return { id, name: doc?.clientName || 'Unknown' }
    })

  function formatFileSize(bytes: number) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const handleFileClick = (fileId: string) => {
    setSelectedFileId(fileId)
    setPreviewOpen(true)
  }

  const handleNavigate = (fileId: string) => {
    setSelectedFileId(fileId)
  }

  const selectedFile = documents.find(d => d.id === selectedFileId)
    ? {
        id: documents.find(d => d.id === selectedFileId)!.id,
        name: documents.find(d => d.id === selectedFileId)!.fileName,
        type: documents.find(d => d.id === selectedFileId)!.fileType,
        url: documents.find(d => d.id === selectedFileId)!.url,
        size: documents.find(d => d.id === selectedFileId)!.sizeBytes,
        uploadedAt: documents.find(d => d.id === selectedFileId)!.uploadedAt,
        tags: documents.find(d => d.id === selectedFileId)!.tags,
      }
    : null

  const previewFiles = documents.map(doc => ({
    id: doc.id,
    name: doc.fileName,
    type: doc.fileType,
    url: doc.url,
    size: doc.sizeBytes,
    uploadedAt: doc.uploadedAt,
    tags: doc.tags,
  }))

  // Calculate stats
  const totalDocuments = documents.length
  const pendingReview = documents.filter(d => d.status === 'pending').length
  const reviewed = documents.filter(d => d.status === 'reviewed').length
  const thisWeek = documents.filter(d => {
    const uploadDate = new Date(d.uploadedAt)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return uploadDate >= weekAgo
  }).length

  const stats = [
    { label: 'Total Documents', value: totalDocuments.toString(), icon: '📄' },
    { label: 'Pending Review', value: pendingReview.toString(), icon: '⏳' },
    { label: 'Reviewed', value: reviewed.toString(), icon: '✅' },
    { label: 'This Week', value: `+${thisWeek}`, icon: '📈' },
  ]

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading documents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Client Documents</h1>
        <p className="text-muted-foreground mt-2">
          View and manage documents from all your clients
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <span className="text-2xl">{stat.icon}</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <Input
                placeholder="Search documents or clients..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-clients">All Clients</SelectItem>
                {uniqueClients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select defaultValue="all-types">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-types">All Types</SelectItem>
                <SelectItem value="w2">W-2</SelectItem>
                <SelectItem value="1099">1099</SelectItem>
                <SelectItem value="receipts">Receipts</SelectItem>
                <SelectItem value="prior-year">Prior Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Documents</CardTitle>
          <CardDescription>Documents uploaded by your clients</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>
                        {doc.fileName.endsWith('.pdf') ? '📄' :
                         doc.fileName.endsWith('.jpg') ? '🖼️' : '📎'}
                      </span>
                      <span className="font-medium">{doc.fileName}</span>
                    </div>
                  </TableCell>
                  <TableCell>{doc.client}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{doc.type}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{doc.size}</TableCell>
                  <TableCell className="text-muted-foreground">{doc.uploadedAt}</TableCell>
                  <TableCell>
                    <Badge
                      variant={doc.status === 'reviewed' ? 'secondary' : 'default'}
                      className={
                        doc.status === 'reviewed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20'
                      }
                    >
                      {doc.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFileClick(doc.id)}
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
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </Button>
                      <Button variant="ghost" size="sm">
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
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Document Management</CardTitle>
          <CardDescription>Bulk actions and tools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-auto flex-col items-start p-4">
              <svg
                className="h-8 w-8 mb-2 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="font-semibold">Request Documents</span>
              <span className="text-xs text-muted-foreground">Ask clients for specific files</span>
            </Button>

            <Button variant="outline" className="h-auto flex-col items-start p-4">
              <svg
                className="h-8 w-8 mb-2 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              <span className="font-semibold">Upload for Client</span>
              <span className="text-xs text-muted-foreground">Add completed forms</span>
            </Button>

            <Button variant="outline" className="h-auto flex-col items-start p-4">
              <svg
                className="h-8 w-8 mb-2 text-primary"
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
              <span className="font-semibold">Export Documents</span>
              <span className="text-xs text-muted-foreground">Download client files as ZIP</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File Preview Modal */}
      <FilePreview
        file={selectedFile}
        files={previewFiles}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onNavigate={handleNavigate}
      />
    </div>
  )
}
