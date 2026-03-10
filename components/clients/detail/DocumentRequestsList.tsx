/**
 * DocumentRequestsList component - displays document requests
 */

'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface DocumentRequest {
  id: string
  documentType: string
  description: string
  priority: string
  dueDate: string
  createdAt?: string
}

interface DocumentRequestsListProps {
  requests: DocumentRequest[]
  loading?: boolean
}

const priorityColors: Record<string, string> = {
  LOW: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  HIGH: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  NORMAL: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
}

export function DocumentRequestsList({ requests, loading }: DocumentRequestsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Requests</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No document requests yet
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.documentType}</TableCell>
                  <TableCell>
                    <Badge
                      className={priorityColors[request.priority]}
                      variant="outline"
                    >
                      {request.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(request.dueDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {request.description}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
