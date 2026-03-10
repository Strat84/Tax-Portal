/**
 * SearchAndFilter component for clients list
 */

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TAX_YEARS } from '../constants'
import { ClientFilters } from '@/graphql/types/clients'

interface SearchAndFilterProps {
  filters: ClientFilters
  onSearchChange: (value: string) => void
  onStatusChange: (value: string) => void
  onYearChange: (value: string) => void
}

export function SearchAndFilter({
  filters,
  onSearchChange,
  onStatusChange,
  onYearChange,
}: SearchAndFilterProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          {/* Search Input */}
          <div className="flex-1 relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <Input
              placeholder="Search clients..."
              className="pl-10"
              value={filters.searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <Select value={filters.statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-status">All Statuses</SelectItem>
              <SelectItem value="documents_pending">Docs Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="ready_for_review">Ready for Review</SelectItem>
              <SelectItem value="filed">Filed</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
            </SelectContent>
          </Select>

          {/* Year Filter */}
          <Select value={filters.yearFilter} onValueChange={onYearChange}>
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="Tax year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {TAX_YEARS.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
