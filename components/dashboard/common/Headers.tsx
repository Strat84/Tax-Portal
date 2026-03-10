'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

/**
 * Page Header Component
 * Consistent header for dashboard pages
 */
interface PageHeaderProps {
  title: string
  description?: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex-1">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground mt-2">{description}</p>}
      </div>
      {action && (
        <Button onClick={action.onClick} asChild={!!action.href}>
          {action.href ? <a href={action.href}>{action.label}</a> : action.label}
        </Button>
      )}
    </div>
  )
}

/**
 * Section Header Component
 * Consistent header for dashboard sections
 */
interface SectionHeaderProps {
  title: string
  description?: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
  badge?: string | number
}

export function SectionHeader({ title, description, action, badge }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {badge !== undefined && (
          <span className="text-sm font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
            {badge}
          </span>
        )}
      </div>
      {action && (
        <Button size="sm" variant="outline" onClick={action.onClick} asChild={!!action.href}>
          {action.href ? <a href={action.href}>{action.label}</a> : action.label}
        </Button>
      )}
    </div>
  )
}

/**
 * Alert Banner Component
 * Displays important alerts with custom styling
 */
interface AlertBannerProps {
  type: 'info' | 'warning' | 'danger' | 'success'
  title: string
  message: string
  icon?: string
}

export function AlertBanner({ type, title, message, icon }: AlertBannerProps) {
  const styles = {
    info: {
      bg: 'bg-blue-100 dark:bg-blue-950/40',
      border: 'border-l-4 border-blue-500 dark:border-blue-600',
      title: 'text-blue-900 dark:text-blue-200',
      message: 'text-blue-800 dark:text-blue-300',
    },
    warning: {
      bg: 'bg-yellow-100 dark:bg-yellow-950/40',
      border: 'border-l-4 border-yellow-500 dark:border-yellow-600',
      title: 'text-yellow-900 dark:text-yellow-200',
      message: 'text-yellow-800 dark:text-yellow-300',
    },
    danger: {
      bg: 'bg-red-100 dark:bg-red-950/40',
      border: 'border-l-4 border-red-500 dark:border-red-600',
      title: 'text-red-900 dark:text-red-200',
      message: 'text-red-800 dark:text-red-300',
    },
    success: {
      bg: 'bg-green-100 dark:bg-green-950/40',
      border: 'border-l-4 border-green-500 dark:border-green-600',
      title: 'text-green-900 dark:text-green-200',
      message: 'text-green-800 dark:text-green-300',
    },
  }

  const style = styles[type]
  const defaultIcon = {
    info: 'ℹ️',
    warning: '⚠️',
    danger: '❌',
    success: '✓',
  }[type]

  return (
    <div className={`${style.bg} ${style.border} p-4 rounded`}>
      <p className={`text-sm font-semibold ${style.title} mb-2`}>
        {icon || defaultIcon} {title}
      </p>
      <p className={`text-sm ${style.message}`}>{message}</p>
    </div>
  )
}

/**
 * Card Section Component
 * Wrapper card for dashboard sections
 */
interface CardSectionProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function CardSection({ title, description, children, className = '' }: CardSectionProps) {
  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  )
}
