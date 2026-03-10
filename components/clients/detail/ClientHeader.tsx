/**
 * ClientHeader component - displays client info and status selector
 */

'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { STATUS_COLORS, STATUS_LABELS } from '../constants'
import type { ClientDetailsInfo, TaxReturnStatus } from '@/graphql/types/clients'

interface ClientHeaderProps {
  client: ClientDetailsInfo
  onStatusChange: (status: TaxReturnStatus) => void
  isUpdating: boolean
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase()
}

export function ClientHeader({ client, onStatusChange, isUpdating }: ClientHeaderProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-4">
            {/* Avatar */}
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">{getInitials(client.name)}</AvatarFallback>
            </Avatar>

            {/* Client Info */}
            <div>
              <h1 className="text-2xl font-bold">{client.name}</h1>
              <p className="text-muted-foreground">{client.email}</p>
              <p className="text-sm text-muted-foreground mt-1">{client.phone}</p>

              {/* Status Badges */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge className={STATUS_COLORS[client.status]} variant="outline">
                  {STATUS_LABELS[client.status] || client.status}
                </Badge>
                <Badge variant="outline">Tax Year {client.taxYear}</Badge>
              </div>
            </div>
          </div>

          {/* Status Change Select */}
          <div className="w-full md:w-64">
            <Select value={client.status} onValueChange={onStatusChange} disabled={isUpdating}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DOCUMENTS_PENDING">Documents Pending</SelectItem>
                <SelectItem value="DOCUMENTS_RECEIVED">Documents Received</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="READY_FOR_REVIEW">Ready for Review</SelectItem>
                <SelectItem value="FILED">Filed</SelectItem>
                <SelectItem value="COMPLETE">Complete</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
