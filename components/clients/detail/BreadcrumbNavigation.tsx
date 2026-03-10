/**
 * BreadcrumbNavigation component for file path navigation
 */

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export interface Breadcrumb {
  id: string | null
  name: string
}

interface BreadcrumbNavigationProps {
  breadcrumbs: Breadcrumb[]
  onNavigate: (segments: string[]) => void
}

export function BreadcrumbNavigation({
  breadcrumbs,
  onNavigate,
}: BreadcrumbNavigationProps) {
  const handleNavigation = (id: string | null) => {
    if (id === null) {
      onNavigate([])
      return
    }

    const segments = id
      .split('/')
      .filter(Boolean)
    onNavigate(segments)
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.id || 'root'} className="flex items-center gap-2">
              {index > 0 && <span className="text-muted-foreground">/</span>}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavigation(crumb.id)}
                className="h-8 hover:underline"
              >
                {crumb.name}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
