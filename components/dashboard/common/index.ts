/**
 * Dashboard Common Components Barrel Export
 * Import all common dashboard components from this file
 */

export { StatCard, StatCardGrid } from './StatCard'
export { LoadingState, ErrorState, EmptyState, ConditionalRender } from './LoadingStates'
export {
  MessageCard,
  ActivityItem,
  StatusBadge,
  PriorityBadge,
  DateDisplay,
  HealthStatus,
} from './Cards'
export { PageHeader, SectionHeader, AlertBanner, CardSection } from './Headers'

// Re-export types
export type { StatCardData } from '@/lib/dashboard/types'
