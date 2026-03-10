/**
 * OverviewTab component - displays personal and tax information
 */

'use client'

import { PersonalInformation } from './PersonalInformation'
import { TaxInformation } from './TaxInformation'
import type { ClientDetailsInfo } from '@/graphql/types/clients'

interface OverviewTabProps {
  client: ClientDetailsInfo
}

export function OverviewTab({ client }: OverviewTabProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <PersonalInformation client={client} />
      <TaxInformation client={client} />
    </div>
  )
}
