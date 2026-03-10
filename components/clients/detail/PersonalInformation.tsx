/**
 * PersonalInformation component - displays client personal details
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { ClientDetailsInfo } from '@/graphql/types/clients'

interface PersonalInformationProps {
  client: ClientDetailsInfo
}

interface InfoField {
  label: string
  value: string | number
}

export function PersonalInformation({ client }: PersonalInformationProps) {
  const fields: InfoField[] = [
    { label: 'Full Name', value: client.name },
    { label: 'Email', value: client.email },
    { label: 'Phone', value: client.phone },
    { label: 'Address', value: client.address },
    { label: 'SSN', value: client.ssn },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {fields.map((field, index) => (
          <div key={field.label}>
            <div className="text-sm text-muted-foreground">{field.label}</div>
            <div className="font-medium">{field.value}</div>
            {index < fields.length - 1 && <Separator className="mt-3" />}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
