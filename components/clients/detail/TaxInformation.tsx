/**
 * TaxInformation component - displays client tax details
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { STATUS_COLORS, STATUS_LABELS } from '../constants'
import type { ClientDetailsInfo } from '@/graphql/types/clients'

interface TaxInformationProps {
  client: ClientDetailsInfo
}

interface TaxField {
  label: string
  value: string | number
  isBadge?: boolean
}

export function TaxInformation({ client }: TaxInformationProps) {
  const fields: TaxField[] = [
    { label: 'Tax Year', value: client.taxYear },
    { label: 'Filing Status', value: client.filingStatus },
    { label: 'Number of Dependents', value: client.dependents },
    { label: 'Status', value: client.status, isBadge: true },
    { label: 'Client Since', value: client.joinedDate },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tax Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {fields.map((field, index) => (
          <div key={field.label}>
            <div className="text-sm text-muted-foreground">{field.label}</div>
            {field.isBadge ? (
              <Badge className={STATUS_COLORS[field.value as string]} variant="outline">
                {STATUS_LABELS[field.value as string] || field.value}
              </Badge>
            ) : (
              <div className="font-medium">{field.value}</div>
            )}
            {index < fields.length - 1 && <Separator className="mt-3" />}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
