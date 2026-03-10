/**
 * ClientRow component for displaying a single client in the table
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TableCell, TableRow } from '@/components/ui/table'
import { STATUS_COLORS, STATUS_LABELS } from '../constants'
import { ClientItem } from '@/graphql/types/clients'

interface ClientRowProps {
  client: ClientItem
}

export function ClientRow({ client }: ClientRowProps) {
  return (
    <TableRow className="cursor-pointer hover:bg-muted/50">
      {/* Client Name & Email */}
      <TableCell>
        <Link href={`/clients/${client.id}`}>
          <div>
            <p className="font-medium hover:underline">
              {client.name} {client.lastname}
            </p>
            <p className="text-sm text-muted-foreground">{client.email}</p>
          </div>
        </Link>
      </TableCell>

      {/* Status Badge */}
      <TableCell>
        {client.status ? (
          <Badge className={STATUS_COLORS[client.status]} variant="outline">
            {STATUS_LABELS[client.status]}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>

      {/* Pending Documents */}
      <TableCell className="text-center">
        {typeof client.pendingDocs === 'number' && client.pendingDocs > 0 ? (
          <Badge variant="destructive">{client.pendingDocs}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>

      {/* Unread Messages */}
      <TableCell className="text-center">
        {typeof client.unreadMessages === 'number' && client.unreadMessages > 0 ? (
          <Badge variant="default">{client.unreadMessages}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>

      {/* Last Activity */}
      <TableCell className="text-muted-foreground">{client.lastActivity}</TableCell>

      {/* Tax Year */}
      <TableCell>{client.taxYear}</TableCell>

      {/* Actions */}
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Link href={`/clients/${client.id}`}>
            <Button variant="ghost" size="sm">
              View
            </Button>
          </Link>
          <Link href={`/messages?client=${client.id}`}>
            <Button variant="ghost" size="sm" title="Send message">
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
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </Button>
          </Link>
        </div>
      </TableCell>
    </TableRow>
  )
}
