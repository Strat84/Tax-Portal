/**
 * FileListView component - displays files in list view
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
  uploadedAt?: string
}

interface FileListViewProps {
  items: FolderItem[]
  onItemDoubleClick: (item: FolderItem) => void
  onRename: (item: FolderItem) => void
  onDelete: (item: FolderItem) => void
}

export function FileListView({
  items,
  onItemDoubleClick,
  onRename,
  onDelete,
}: FileListViewProps) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          onDoubleClick={() => onItemDoubleClick(item)}
          className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="text-3xl">{getFileIcon(item)}</div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{item.name}</p>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                {item.type === 'FILE' && item.size && (
                  <>
                    <span>{formatFileSize(item.size)}</span>
                    {item.uploadedAt && (
                      <>
                        <span>•</span>
                        <span>{item.uploadedAt}</span>
                      </>
                    )}
                  </>
                )}
                {item.type === 'FOLDER' && (
                  <span>{((item.totalFiles ?? 1) - 1) || 0} items</span>
                )}
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
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
        </div>
      ))}
    </div>
  )
}
