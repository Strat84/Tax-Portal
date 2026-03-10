/**
 * StatsCard component for displaying client statistics
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClientStat } from '@/graphql/types/clients'

interface StatsCardProps {
  stat: ClientStat
}

export function StatsCard({ stat }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
        <span className="text-2xl">{stat.icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stat.value}</div>
      </CardContent>
    </Card>
  )
}
