/**
 * FileGridView component - displays files in grid view
 */

'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatFileSize, getFileIcon } from '@/lib/clients/fileUtility'

interface FolderItem {
  name: string
  type: 'FILE' | 'FOLDER'
  id: string
  size: number
  totalFiles?: number
}

interface FileGridViewProps {
  items: FolderItem[]
  onItemDoubleClick: (item: FolderItem) => void
  onRename: (item: FolderItem) => void
  onDelete: (item: FolderItem) => void
}

export function FileGridView({
  items,
  onItemDoubleClick,
  onRename,
  onDelete,
}: FileGridViewProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {items.map((item) => (
        <div
          key={item.id}
          onDoubleClick={() => onItemDoubleClick(item)}
          className="group border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-md transition-all cursor-pointer relative"
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                  />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onRename(item)
                }}
              >
                Rename
              </DropdownMenuItem>
              {item.type === 'FILE' && (
                <DropdownMenuItem>Download</DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(item)
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex flex-col items-center text-center">
            <div className="text-5xl mb-2">{getFileIcon(item)}</div>
            <p className="font-medium text-sm truncate w-full mb-1">
              {item.name}
            </p>
            {item.type === 'FILE' && item.size && (
              <p className="text-xs text-muted-foreground">
                {formatFileSize(item.size)}
              </p>
            )}
            {item.type === 'FOLDER' && (
              <p className="text-xs text-muted-foreground">
                {((item.totalFiles ?? 1) - 1) || 0} items
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
