/**
 * Dashboard Hooks
 * Custom hooks for dashboard-specific operations
 */

import { useEffect, useState, useCallback, useMemo } from 'react'
import { DeadlineInfo } from '@/lib/dashboard/types'
import { calculateDaysUntil, getDeadlineDate } from '@/lib/dashboard/utils'
import { TAX_DEADLINES } from '@/lib/dashboard/constants'

/**
 * Hook for managing tax deadlines
 * Calculates days remaining and provides deadline info
 */
export function useTaxDeadlines() {
  const IRSDeadline = useMemo(() => {
    const date = getDeadlineDate(TAX_DEADLINES.IRS_DEADLINE.month, TAX_DEADLINES.IRS_DEADLINE.day)
    const daysRemaining = calculateDaysUntil(date)
    
    return {
      label: TAX_DEADLINES.IRS_DEADLINE.name,
      date,
      daysRemaining,
      variant: daysRemaining <= 30 ? 'danger' as const : 'warning' as const,
    }
  }, [])

  const InternalDeadline = useMemo(() => {
    const date = getDeadlineDate(TAX_DEADLINES.INTERNAL_DEADLINE.month, TAX_DEADLINES.INTERNAL_DEADLINE.day)
    const daysRemaining = calculateDaysUntil(date)
    
    return {
      label: TAX_DEADLINES.INTERNAL_DEADLINE.name,
      date,
      daysRemaining,
      variant: daysRemaining <= 7 ? 'danger' as const : 'warning' as const,
    }
  }, [])

  const isNearDeadline = IRSDeadline.daysRemaining <= 30
  const isPassedDeadline = IRSDeadline.daysRemaining < 0
  const isUrgent = IRSDeadline.daysRemaining <= 7

  return {
    IRSDeadline,
    InternalDeadline,
    isNearDeadline,
    isPassedDeadline,
    isUrgent,
  }
}

/**
 * Hook for managing dashboard loading states
 */
interface LoadState {
  isLoading: boolean
  error?: string | null
  isEmpty: boolean
}

export function useDashboardLoadState(
  isLoading: boolean,
  error?: string | null,
  data?: any[]
): LoadState {
  return {
    isLoading,
    error,
    isEmpty: !isLoading && !error && (!data || data.length === 0),
  }
}

/**
 * Hook for managing pagination in dashboard tables
 */
interface UsePaginationOptions {
  initialPage?: number
  itemsPerPage?: number
}

export function usePagination(items: any[], options?: UsePaginationOptions) {
  const itemsPerPage = options?.itemsPerPage || 10
  const [currentPage, setCurrentPage] = useState(options?.initialPage || 1)

  const totalPages = Math.ceil(items.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = items.slice(startIndex, endIndex)

  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages))
    setCurrentPage(validPage)
  }, [totalPages])

  const nextPage = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage])
  const prevPage = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage])

  return {
    currentPage,
    totalPages,
    currentItems,
    goToPage,
    nextPage,
    prevPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  }
}

/**
 * Hook for filtering dashboard items
 */
interface UseFilterOptions {
  searchField?: string
  filterField?: string
}

export function useDashboardFilter(
  items: any[],
  options?: UseFilterOptions
) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterValue, setFilterValue] = useState('')
  const searchField = options?.searchField || 'name'
  const filterField = options?.filterField || 'status'

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = searchTerm === '' || 
        (item[searchField]?.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesFilter = filterValue === '' || 
        (item[filterField]?.toString() === filterValue)
      
      return matchesSearch && matchesFilter
    })
  }, [items, searchTerm, filterValue, searchField, filterField])

  return {
    searchTerm,
    setSearchTerm,
    filterValue,
    setFilterValue,
    filteredItems,
    resetFilters: () => {
      setSearchTerm('')
      setFilterValue('')
    },
  }
}

/**
 * Hook for sorting dashboard data
 */
type SortOrder = 'asc' | 'desc'

interface UseSortOptions {
  initialField?: string
  initialOrder?: SortOrder
}

export function useDashboardSort(items: any[], options?: UseSortOptions) {
  const [sortField, setSortField] = useState(options?.initialField || '')
  const [sortOrder, setSortOrder] = useState<SortOrder>(options?.initialOrder || 'asc')

  const sortedItems = useMemo(() => {
    if (!sortField) return items

    const sorted = [...items].sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [items, sortField, sortOrder])

  const toggleSort = useCallback((field: string) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }, [sortField])

  return {
    sortField,
    sortOrder,
    sortedItems,
    toggleSort,
  }
}

/**
 * Hook for managing dashboard notifications/alerts
 */
interface DashboardAlert {
  id: string
  type: 'info' | 'warning' | 'danger' | 'success'
  title: string
  message: string
}

export function useDashboardAlerts() {
  const [alerts, setAlerts] = useState<DashboardAlert[]>([])

  const addAlert = useCallback((alert: Omit<DashboardAlert, 'id'>) => {
    const id = `alert-${Date.now()}`
    setAlerts((prev) => [...prev, { ...alert, id }])

    // Auto-remove after 5 seconds
    const timer = setTimeout(() => {
      removeAlert(id)
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id))
  }, [])

  return {
    alerts,
    addAlert,
    removeAlert,
    clearAlerts: () => setAlerts([]),
  }
}

/**
 * Hook for debounced search in dashboard
 */
export function useDebouncedSearch(
  searchFn: (term: string) => Promise<any[]>,
  delay: number = 300
) {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    setIsSearching(true)
    const timer = setTimeout(async () => {
      if (searchTerm.trim()) {
        const data = await searchFn(searchTerm)
        setResults(data)
      } else {
        setResults([])
      }
      setIsSearching(false)
    }, delay)

    return () => clearTimeout(timer)
  }, [searchTerm, searchFn, delay])

  return {
    searchTerm,
    setSearchTerm,
    results,
    isSearching,
  }
}

/**
 * Hook for managing dashboard preferences/settings
 */
interface DashboardPreferences {
  itemsPerPage: number
  viewMode: 'grid' | 'list'
  sortBy: string
  filterStatus: string
}

export function useDashboardPreferences(key: string, defaultPreferences?: Partial<DashboardPreferences>) {
  const [preferences, setPreferences] = useState<DashboardPreferences>(() => {
    try {
      const stored = localStorage.getItem(`dashboard-preferences-${key}`)
      return stored ? JSON.parse(stored) : {
        itemsPerPage: 10,
        viewMode: 'grid' as const,
        sortBy: 'name',
        filterStatus: 'all',
        ...defaultPreferences,
      }
    } catch {
      return {
        itemsPerPage: 10,
        viewMode: 'grid' as const,
        sortBy: 'name',
        filterStatus: 'all',
        ...defaultPreferences,
      }
    }
  })

  const updatePreferences = useCallback((updates: Partial<DashboardPreferences>) => {
    setPreferences((prev) => {
      const updated = { ...prev, ...updates }
      localStorage.setItem(`dashboard-preferences-${key}`, JSON.stringify(updated))
      return updated
    })
  }, [key])

  return {
    preferences,
    updatePreferences,
  }
}

/**
 * Hook for managing dashboard refresh intervals
 */
export function useDashboardRefresh(
  refreshFn: () => Promise<void>,
  intervalMs: number = 30000,
  enabled: boolean = true
) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  useEffect(() => {
    if (!enabled) return

    const interval = setInterval(async () => {
      setIsRefreshing(true)
      try {
        await refreshFn()
        setLastRefresh(new Date())
      } catch (error) {
        console.error('Dashboard refresh error:', error)
      } finally {
        setIsRefreshing(false)
      }
    }, intervalMs)

    return () => clearInterval(interval)
  }, [refreshFn, intervalMs, enabled])

  const refresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refreshFn()
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Dashboard refresh error:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [refreshFn])

  return {
    isRefreshing,
    lastRefresh,
    refresh,
  }
}
