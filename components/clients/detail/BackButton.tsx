/**
 * BackButton component - navigation back to clients list
 */

'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function BackButton() {
  return (
    <Link href="/clients">
      <Button variant="ghost" size="sm">
        <svg
          className="h-4 w-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Clients
      </Button>
    </Link>
  )
}
