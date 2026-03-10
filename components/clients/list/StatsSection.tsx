/**
 * StatsSection component for displaying all client statistics
 */

import { ClientStat } from '@/graphql/types/clients'
import { StatsCard } from './StatsCard'

interface StatsSectionProps {
  stats: ClientStat[]
}

export function StatsSection({ stats }: StatsSectionProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatsCard key={stat.label} stat={stat} />
      ))}
    </div>
  )
}
