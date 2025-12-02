# File Preview System

A modern, intuitive file preview modal that allows users to view documents without downloading them.

## Overview

The File Preview System provides an in-browser preview experience for multiple file types with navigation, zoom controls, and quick actions. It's integrated throughout the application for seamless document viewing.

## Supported File Types

### Full Preview Support
- **PDFs**: Full preview with zoom controls and print functionality
- **Images**: JPG, PNG, GIF with zoom controls
  - High-quality image display
  - Pinch-to-zoom friendly

### Graceful Fallback
- **Excel Files** (.xlsx, .xls): Shows icon with download option
- **Word Documents** (.docx, .doc): Shows icon with download option
- **Other Files**: Generic preview with download option

## Features

### Core Functionality

**File Information Header**
- File name with icon
- File size display
- Upload date
- Tags/labels
- Current position in collection (e.g., "3 of 12")

**Zoom Controls** (PDF & Images)
- Zoom in (+25% increments)
- Zoom out (-25% increments)
- Reset to 100%
- Range: 25% to 200%

**Navigation** (Multi-File Collections)
- Previous/Next buttons
- Keyboard navigation (← →)
- Current position indicator
- Disabled states when at boundaries

**Quick Actions**
- Download file
- Print (PDFs only)
- Close preview (Esc key)

**Keyboard Shortcuts**
- `←` Previous file
- `→` Next file
- `Esc` Close preview
- Hint displayed at bottom of modal

### User Experience

**Responsive Design**
- Full-screen modal (90vh height)
- Works on desktop, tablet, and mobile
- Touch-friendly controls
- Optimized for different screen sizes

**Loading States**
- Progress indicator while loading
- Smooth transitions between files
- Error handling with helpful messages

**Accessibility**
- Keyboard navigation support
- ARIA labels (via Dialog component)
- Focus management
- Screen reader friendly

## Integration Points

### 1. Client Documents Page
**Location**: `/client/documents`

- Click any file card (grid or list view) to open preview
- Navigate through all visible files
- Respects current search/filter
- Opens at clicked file position

### 2. Tax Pro Documents Page
**Location**: `/tax-pro/documents`

- Click "View" button in documents table
- Preview client-uploaded documents
- Navigate through all documents
- Access from any document row

### 3. Document Request Cards
**Location**: `/client/requests`, `/tax-pro/requests`

- "View Document" button appears when document is uploaded
- Available for "uploaded" and "approved" statuses
- Shows uploaded document in context of request
- Quick access without leaving request view

## Component API

### FilePreview Component

```tsx
interface FilePreviewProps {
  file: FilePreviewFile | null
  files?: FilePreviewFile[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate?: (fileId: string) => void
}

interface FilePreviewFile {
  id: string
  name: string
  type: string  // MIME type
  url: string   // File URL
  size: number  // Bytes
  uploadedAt?: string
  tags?: string[]
}
```

### Usage Example

```tsx
import { FilePreview } from '@/components/files/FilePreview'
import { useState } from 'react'

function MyComponent() {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)

  const files = [
    {
      id: '1',
      name: 'Tax_Return.pdf',
      type: 'application/pdf',
      url: '/path/to/file.pdf',
      size: 245000,
      uploadedAt: '2025-02-15',
      tags: ['W-2', '2025'],
    },
    // ... more files
  ]

  const handleFileClick = (fileId: string) => {
    setSelectedFileId(fileId)
    setPreviewOpen(true)
  }

  const handleNavigate = (fileId: string) => {
    setSelectedFileId(fileId)
  }

  const selectedFile = files.find(f => f.id === selectedFileId) || null

  return (
    <>
      {files.map(file => (
        <div key={file.id} onClick={() => handleFileClick(file.id)}>
          {file.name}
        </div>
      ))}

      <FilePreview
        file={selectedFile}
        files={files}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onNavigate={handleNavigate}
      />
    </>
  )
}
```

## Technical Implementation

### Component Structure

```
FilePreview
├── Dialog (from shadcn/ui)
│   ├── DialogHeader
│   │   ├── File Icon
│   │   ├── File Info (name, size, date, position)
│   │   └── Tags
│   ├── Toolbar
│   │   ├── Navigation Buttons (if multiple files)
│   │   ├── Zoom Controls (PDF/images)
│   │   ├── Download Button
│   │   └── Print Button (PDFs)
│   ├── Preview Content
│   │   ├── Loading State
│   │   ├── Error State
│   │   ├── PDF Viewer (iframe)
│   │   ├── Image Viewer
│   │   └── Unsupported File Message
│   └── Keyboard Shortcuts Hint
```

### State Management

```tsx
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)
const [zoom, setZoom] = useState(100)
```

### File Type Detection

```tsx
// PDF Preview
if (file.type === 'application/pdf') {
  return <iframe src={file.url} />
}

// Image Preview
if (file.type.startsWith('image/')) {
  return <img src={file.url} />
}

// Spreadsheet
if (file.type.includes('spreadsheet') || file.name.endsWith('.xlsx')) {
  return <DownloadPrompt />
}
```

### Keyboard Navigation

```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && hasPrevious) {
      handlePrevious()
    } else if (e.key === 'ArrowRight' && hasNext) {
      handleNext()
    } else if (e.key === 'Escape') {
      onOpenChange(false)
    }
  }

  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [open, hasPrevious, hasNext])
```

## File URL Handling

### Development (Mock Data)
Currently using public URLs for demonstration:
- IRS PDF forms for tax documents
- Unsplash for image examples

### Production (Supabase Storage)

```tsx
// Get signed URL for file
const { data } = await supabase.storage
  .from('documents')
  .createSignedUrl(filePath, 3600) // 1 hour expiry

// Use in preview
<FilePreview
  file={{
    ...fileData,
    url: data.signedUrl
  }}
/>
```

### Security Considerations

1. **Signed URLs**: Use temporary signed URLs with expiration
2. **Access Control**: Verify user permissions before generating URL
3. **RLS Policies**: Supabase Storage RLS controls file access
4. **CORS**: Configure storage bucket for preview access
5. **Content-Type**: Ensure correct MIME types

## Performance Optimizations

### Current Optimizations
- Lazy loading of preview content
- Zoom state reset on file change
- Cleanup of event listeners
- Progress indicators for loading

### Future Enhancements
- Image thumbnails for faster preview
- PDF.js for better PDF rendering
- Virtual scrolling for large PDFs
- Caching of frequently accessed files
- Progressive loading for large files

## Error Handling

### Error States
- **File not found**: Shows error with download fallback
- **Loading failure**: Retry option or download
- **Unsupported type**: Clear message with download button
- **Network error**: Helpful error message

### Error Messages
```tsx
if (error) {
  return (
    <div>
      <p>Unable to preview file</p>
      <p>{error}</p>
      <Button onClick={handleDownload}>Download File</Button>
    </div>
  )
}
```

## Browser Compatibility

### Fully Supported
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Graceful Degradation
- Older browsers: Download fallback
- Mobile browsers: Native viewer may override
- PDF support: Depends on browser PDF plugin

## Accessibility

### Features
- Keyboard navigation
- ARIA labels from Dialog component
- Focus management
- High contrast mode support
- Screen reader announcements

### Best Practices
- Descriptive button labels
- Keyboard shortcut hints
- Error messages are announced
- Loading states are announced

## Testing Checklist

- [ ] PDF files preview correctly
- [ ] Images display and zoom works
- [ ] Navigation between files works
- [ ] Keyboard shortcuts function
- [ ] Download button works
- [ ] Print button works (PDFs)
- [ ] Loading states display
- [ ] Error states display gracefully
- [ ] Zoom controls work correctly
- [ ] Mobile responsive
- [ ] Touch gestures work
- [ ] Close/ESC key works
- [ ] File info displays correctly
- [ ] Tags display when present
- [ ] Position indicator shows correctly

## Future Enhancements

### Short Term
1. **PDF.js Integration**: Better PDF rendering
2. **Annotation Support**: Mark up documents
3. **Full-screen Mode**: Dedicated full-screen view
4. **Thumbnail Navigation**: Quick file selector
5. **Share Link**: Generate shareable preview link

### Long Term
1. **OCR Integration**: Extract text from images
2. **Comparison View**: Side-by-side comparison
3. **Version History**: View document versions
4. **Comments**: Add comments to specific pages
5. **Digital Signature**: Sign documents in preview
6. **Print Options**: Custom print settings
7. **Export Options**: Convert formats
8. **Collaboration**: Real-time co-viewing

## Troubleshooting

### Preview Not Loading
1. Check file URL is accessible
2. Verify CORS configuration
3. Check browser console for errors
4. Ensure file type is supported
5. Try download to verify file integrity

### PDF Not Displaying
1. Check if browser has PDF plugin
2. Try different PDF viewer library
3. Verify PDF is not corrupted
4. Check file permissions

### Images Not Showing
1. Verify image format is supported
2. Check image URL accessibility
3. Verify image isn't too large
4. Check network connection

### Navigation Not Working
1. Verify multiple files are provided
2. Check onNavigate handler is provided
3. Ensure file IDs are unique
4. Check keyboard event listeners

## Analytics

Track preview usage:
- Files previewed vs downloaded
- Preview duration
- Zoom usage patterns
- Navigation patterns
- Error rates by file type
- Most previewed document types

## Related Documentation
- [Document Request System](./DOCUMENT_REQUEST_SYSTEM.md)
- [File Upload System](./FILE_UPLOAD_SYSTEM.md)
- [Supabase Storage Setup](./SUPABASE_STORAGE.md)
