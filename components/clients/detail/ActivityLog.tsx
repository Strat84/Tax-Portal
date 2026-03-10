/**
 * ActivityLog component - displays client activity history
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export interface ActivityItem {
  id: string
  action: string
  details: string
  time: string
}

interface ActivityLogProps {
  activities: ActivityItem[]
  loading?: boolean
}

export function ActivityLog({ activities, loading }: ActivityLogProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
        <CardDescription>Recent activity for this client</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No activity yet
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((item, index) => (
              <div key={item.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  {index < activities.length - 1 && (
                    <div
                      className="flex-1 w-px bg-border mt-2"
                      style={{ minHeight: '40px' }}
                    />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-medium">{item.action}</p>
                  <p className="text-sm text-muted-foreground">{item.details}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
