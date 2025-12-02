# Document Request System

A modern, intuitive document request and fulfillment system for the Tax Portal.

## Overview

The Document Request System allows tax professionals to formally request specific documents from clients through a structured workflow. Unlike simple messaging, this system provides:

- **Structured Requests**: Defined document types, descriptions, priorities, and due dates
- **Visual Tracking**: Clear status indicators and progress tracking
- **Automatic Confirmations**: System confirms when documents are uploaded
- **Priority Management**: Urgent, high, normal, and low priority levels
- **Deadline Tracking**: Visual indicators for due dates and overdue requests
- **Approval Workflow**: Tax pros can approve or reject uploaded documents

## System Architecture

### Database Schema

The system uses the `document_requests` table with the following structure:

```sql
CREATE TABLE document_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  tax_professional_id UUID NOT NULL REFERENCES tax_professionals(id),
  document_type TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'uploaded', 'approved', 'rejected', 'cancelled')),
  due_date DATE NOT NULL,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  fulfilled_at TIMESTAMPTZ,
  notes TEXT,
  client_notes TEXT,
  file_id UUID REFERENCES files(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

### Status Flow

```
pending → uploaded → approved
              ↓
           rejected → pending (client re-uploads)
```

### Automatic Triggers

When a client uploads a document and links it to a request:
- Status automatically changes from `pending` to `uploaded`
- `fulfilled_at` timestamp is set
- Tax professional is notified (when notifications are implemented)

## User Experience

### For Clients

#### Request Card Features

Each document request is displayed as a beautiful, informative card showing:

1. **Visual Priority Indicators**
   - Icon and color-coded badges
   - Low (📋 gray), Normal (📄 blue), High (⚡ orange), Urgent (🚨 red)

2. **Clear Requirements**
   - Document type prominently displayed
   - Detailed description of what's needed
   - Additional instructions from tax professional

3. **Deadline Information**
   - Due date with countdown
   - "Due in X days" for upcoming deadlines
   - "Overdue by X days" for missed deadlines
   - Color-coded urgency (yellow for upcoming, red for overdue)

4. **Status Indicators**
   - Pending: Yellow "⏳ Pending" badge
   - Uploaded: Blue "📤 Uploaded" with review status
   - Approved: Green "✅ Approved" with completion confirmation

5. **One-Click Upload**
   - Large, prominent upload button
   - Opens modal with drag-and-drop file selection
   - Optional notes field for client comments
   - Real-time upload progress bar
   - Success confirmation

#### Page Organization

**Stats Dashboard**
- Pending Requests count
- Under Review count
- Completed count
- Total Requests

**Urgent Notice Banner**
- Appears when requests are due within 3 days
- Shows count of urgent items
- Orange color for visibility

**Filtered Tabs**
- All (shows everything)
- Pending (action required)
- Under Review (waiting for tax pro)
- Completed (approved documents)

**Priority Filter**
- Filter by urgency level
- Helps clients focus on what matters most

**Help Section**
- Tips for uploading quality documents
- Formatting recommendations
- Best practices

### For Tax Professionals

#### Request Creation

Two modes for creating requests:

1. **Single Request**
   - Select client
   - Choose document type from 17 predefined types
   - Add description and instructions
   - Set priority level
   - Set due date
   - Add optional notes

2. **Bulk Request**
   - Select multiple clients
   - Request same document from all
   - Saves time for common requests (e.g., W-2s from all clients)

#### Predefined Document Types

- W-2 Form
- W-4 Form
- 1099-INT
- 1099-DIV
- 1099-MISC
- 1099-NEC
- Schedule C
- Schedule E
- Property Tax Statement
- Mortgage Interest Statement (1098)
- Student Loan Interest Statement
- Medical Expense Receipts
- Charitable Donation Receipts
- Business Expense Receipts
- Driver's License / ID
- Social Security Card
- Prior Year Tax Return
- Other Document

#### Request Management

**Stats Dashboard**
- Active Requests (pending)
- Awaiting Review (uploaded, needs action)
- Completed (approved)
- Overdue count

**Requests Table**
Shows all requests with:
- Client name
- Document type
- Priority badge
- Due date
- Status badge
- Request date
- Action buttons

**Quick Actions for Uploaded Documents**
- ✅ Approve button (green)
- ❌ Reject button (red) - sends back to client for revision
- View button to see document

**Search and Filter**
- Search by client name or document type
- Filter by status (all, pending, uploaded, approved, rejected)

## Implementation Details

### Components

**`DocumentRequestCard.tsx`**
Location: `/components/documents/DocumentRequestCard.tsx`

Features:
- Self-contained request display and upload functionality
- Priority and status color coding
- Responsive design
- Upload modal with progress tracking
- File validation
- Deadline calculations with visual indicators

Props:
```typescript
interface DocumentRequestCardProps {
  request: DocumentRequest
  onUpload: (requestId: string, file: File, notes: string) => Promise<void>
}
```

### Pages

**Client View**
- Route: `/client/requests`
- File: `/app/(dashboard)/client/requests/page.tsx`
- Features: Tabbed interface, filtering, stats, help section

**Tax Pro View**
- Route: `/tax-pro/requests`
- File: `/app/(dashboard)/tax-pro/requests/page.tsx`
- Features: Create/bulk requests, manage responses, approve/reject

### Navigation Integration

Both client and tax pro layouts include a "Requests" menu item with a clipboard icon:

```tsx
{
  label: 'Requests',
  href: '/[role]/requests',
  icon: <ClipboardCheckIcon />
}
```

## API Integration (TODO)

Currently using mock data. To integrate with Supabase:

### Fetching Requests

**Client Side:**
```typescript
const { data: requests } = await supabase
  .from('document_requests')
  .select(`
    *,
    tax_professionals!inner(
      users!inner(name)
    ),
    files(name, uploaded_at)
  `)
  .eq('client_id', clientId)
  .order('due_date', { ascending: true })
```

**Tax Pro Side:**
```typescript
const { data: requests } = await supabase
  .from('document_requests')
  .select(`
    *,
    clients!inner(
      users!inner(name)
    ),
    files(name, uploaded_at)
  `)
  .eq('tax_professional_id', taxProId)
  .order('requested_at', { ascending: false })
```

### Creating a Request

```typescript
const { data, error } = await supabase
  .from('document_requests')
  .insert({
    client_id: clientId,
    tax_professional_id: taxProId,
    document_type: documentType,
    description: description,
    priority: priority,
    due_date: dueDate,
    notes: notes,
    status: 'pending',
  })
  .select()
  .single()
```

### Uploading Document

```typescript
// 1. Upload file to Supabase Storage
const { data: fileData, error: uploadError } = await supabase.storage
  .from('documents')
  .upload(`${clientId}/${filename}`, file)

// 2. Create file record
const { data: fileRecord } = await supabase
  .from('files')
  .insert({
    user_id: userId,
    name: filename,
    path: fileData.path,
    size: file.size,
    type: file.type,
  })
  .select()
  .single()

// 3. Link file to request (this triggers auto-status update)
const { error: linkError } = await supabase
  .from('document_requests')
  .update({
    file_id: fileRecord.id,
    client_notes: clientNotes,
  })
  .eq('id', requestId)
```

### Approve/Reject Document

```typescript
// Approve
await supabase
  .from('document_requests')
  .update({ status: 'approved' })
  .eq('id', requestId)

// Reject (client can re-upload)
await supabase
  .from('document_requests')
  .update({
    status: 'rejected',
    file_id: null, // Clear file link
    fulfilled_at: null,
  })
  .eq('id', requestId)
```

## Notifications (Future Enhancement)

When implementing email notifications with Resend:

**Client Notifications:**
- New document request created
- Document approved
- Document rejected (needs revision)
- Deadline reminder (3 days before, 1 day before)
- Overdue reminder

**Tax Pro Notifications:**
- Client uploaded requested document
- Document ready for review
- Deadline approaching for client upload

## Security Considerations

### Row-Level Security (RLS)

Already configured in migration `002_rls_policies.sql`:

**Clients can:**
- View their own document requests
- Update only the `file_id` and `client_notes` fields
- Only when status is `pending` or `rejected`

**Tax Professionals can:**
- View requests for their assigned clients
- Create new requests for their clients
- Update status to `approved` or `rejected`
- Cannot modify `file_id` (client uploads only)

**Admins can:**
- View all requests
- Update any fields

### File Upload Security

Files uploaded through document requests should:
- Be validated for type and size (implemented in FileUpload component)
- Be stored in client-specific folders
- Have access controlled through Supabase Storage RLS policies
- Be scanned for viruses (implement with third-party service)

## Analytics and Reporting

Metrics to track:
- Average time from request to upload
- Approval rate (approved vs rejected)
- Overdue request percentage
- Requests per client
- Most commonly requested document types
- Tax pro response time (upload to approval)

## Best Practices

### For Tax Professionals

1. **Be Specific**: Clear descriptions reduce back-and-forth
2. **Set Realistic Deadlines**: Give clients adequate time
3. **Use Priority Wisely**: Too many "urgent" requests reduce effectiveness
4. **Provide Examples**: Include what good vs bad uploads look like in notes
5. **Bulk Requests**: Use for common items (W-2s, IDs) to save time
6. **Quick Review**: Approve or reject uploads promptly to maintain momentum

### For Clients

1. **Check Quality**: Ensure documents are clear and complete
2. **Use Notes**: Explain unusual circumstances or missing items
3. **Upload Promptly**: Don't wait until deadline
4. **Check Requirements**: Read description and instructions carefully
5. **Ask Questions**: Use messages if request is unclear

## Testing Checklist

- [ ] Client can view all their requests
- [ ] Priority badges display correct colors
- [ ] Due date countdown calculates correctly
- [ ] Overdue requests show red warning
- [ ] Upload modal opens and closes properly
- [ ] File upload with progress bar works
- [ ] Status updates to "uploaded" after upload
- [ ] Tax pro can create individual request
- [ ] Tax pro can create bulk request
- [ ] Requests appear in correct status tabs
- [ ] Search and filter work correctly
- [ ] Approve/reject buttons work
- [ ] Status transitions follow proper flow
- [ ] Mobile responsive design works
- [ ] Urgent notice banner appears when appropriate

## Future Enhancements

1. **Document Templates**: Pre-fill common request types
2. **Recurring Requests**: Annual requests for regular clients
3. **Request Bundles**: Group related documents (e.g., "Complete Tax Package")
4. **Smart Reminders**: ML-based optimal reminder timing
5. **OCR Integration**: Auto-extract data from uploaded documents
6. **Mobile App**: Native mobile upload experience
7. **Video Instructions**: Tax pros can record video guides for complex requests
8. **Live Status Sync**: Real-time updates using Supabase Realtime
9. **Request History**: View all historical requests for a client
10. **Analytics Dashboard**: Visual metrics for tax pros and admins
