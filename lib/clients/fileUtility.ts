/**
 * File-related utility functions
 */

// import { FolderItem } from '@/hooks/useFileManagement'

interface FolderItem {
  name: string
  type: 'FILE' | 'FOLDER' | 'IMAGE'
  id: string
  size: number
  totalFiles?: number
  uploadedAt?: string
}

/**
 * Format bytes to human-readable size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Get emoji icon for file based on type
 */
export function getFileIcon(item: FolderItem): string {
  if (item.type === 'FOLDER') return '📁'

  const ext = item.name.split('.').pop()?.toLowerCase() || ''

  // Documents
  if (['pdf'].includes(ext)) return '📄'
  if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) return '📝'
  if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊'
  if (['ppt', 'pptx'].includes(ext)) return '🎯'

  // Images
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return '🖼️'

  // Archives
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return '📦'

  // Code
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c'].includes(ext)) return '💻'

  // Default
  return '📎'
}

/**
 * Sort folder items - folders first, then alphabetically
 */
export function sortItems(items: FolderItem[]): FolderItem[] {
  return [...items].sort((a, b) => {
    // Folders before files
    if (a.type === 'FOLDER' && b.type !== 'FOLDER') return -1
    if (a.type !== 'FOLDER' && b.type === 'FOLDER') return 1

    // Alphabetically within same type
    return a.name.localeCompare(b.name, undefined, { numeric: true })
  })
}

/**
 * Normalize path - ensure consistent format
 */
export function normalizePath(path: string): string {
  const cleaned = path.replace(/^\/+|\/+$/g, '')
  return cleaned === '' ? '/' : `/${cleaned}`
}

/**
 * Clean path for API - ensure trailing slash for folders
 */
export function cleanPathForApi(path: string): string {
  const normalized = normalizePath(path)
  return normalized === '/' ? '/' : `${normalized}/`
}

/**
 * Get breadcrumb segments from path
 */
export function getBreadcrumbSegments(path: string): Array<{ id: string | null; name: string }> {
  const normalized = normalizePath(path)

  if (normalized === '/') {
    return [{ id: null, name: 'Documents' }]
  }

  const parts = normalized.split('/').filter(Boolean)
  const breadcrumbs: Array<{ id: string | null; name: string }> = [{ id: null, name: 'Documents' }]

  parts.forEach((part, index) => {
    const segmentPath = '/' + parts.slice(0, index + 1).join('/')
    breadcrumbs.push({ id: segmentPath, name: part })
  })

  return breadcrumbs
}

/**
 * Get folder name from path
 */
export function getFolderName(path: string, fallback: string = 'All Documents'): string {
  const normalized = normalizePath(path)

  if (normalized === '/') {
    return fallback
  }

  const lastSegment = normalized.split('/').filter(Boolean).pop()
  return lastSegment || fallback
}

/**
 * Check if item is a document (file, not folder)
 */
export function isDocument(item: FolderItem): boolean {
  return item.type === 'FILE' || item.type === 'IMAGE'
}

/**
 * Check if path is root
 */
export function isRootPath(path: string): boolean {
  return normalizePath(path) === '/'
}

/**
 * Get parent path
 */
export function getParentPath(path: string): string {
  if (isRootPath(path)) return '/'

  const normalized = normalizePath(path)
  const parts = normalized.split('/').filter(Boolean)

  if (parts.length === 0) return '/'

  return '/' + parts.slice(0, -1).join('/')
}
