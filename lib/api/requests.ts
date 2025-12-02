import { createClient } from '@/lib/db/supabase'

export interface DocumentRequest {
  id: string
  clientId: string
  taxProfessionalId: string
  documentType: string
  description: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: 'pending' | 'uploaded' | 'approved' | 'rejected' | 'cancelled'
  dueDate: string
  requestedAt: string
  fulfilledAt?: string
  notes?: string
  clientNotes?: string
  fileId?: string
  // Populated fields
  clientName?: string
  taxProName?: string
  uploadedFileName?: string
  uploadedFileUrl?: string
  uploadedFileType?: string
  uploadedFileSize?: number
}

export async function getClientRequests(clientId: string): Promise<DocumentRequest[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('document_requests')
    .select(`
      *,
      clients!inner(
        user_id,
        tax_professional_id
      ),
      tax_professionals!inner(
        users!inner(name)
      ),
      files(name, path, type, size, uploaded_at)
    `)
    .eq('clients.user_id', clientId)
    .order('due_date', { ascending: true })

  if (error) {
    console.error('Error fetching client requests:', error)
    throw new Error('Failed to fetch document requests')
  }

  return data.map(req => ({
    id: req.id,
    clientId: req.client_id,
    taxProfessionalId: req.tax_professional_id,
    documentType: req.document_type,
    description: req.description,
    priority: req.priority,
    status: req.status,
    dueDate: req.due_date,
    requestedAt: req.requested_at,
    fulfilledAt: req.fulfilled_at,
    notes: req.notes,
    clientNotes: req.client_notes,
    fileId: req.file_id,
    taxProName: req.tax_professionals?.users?.name,
    uploadedFileName: req.files?.name,
    uploadedFileType: req.files?.type,
    uploadedFileSize: req.files?.size,
  }))
}

export async function getTaxProRequests(taxProId: string): Promise<DocumentRequest[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('document_requests')
    .select(`
      *,
      clients!inner(
        users!inner(name)
      ),
      files(name, path, type, size, uploaded_at)
    `)
    .eq('tax_professional_id', taxProId)
    .order('requested_at', { ascending: false })

  if (error) {
    console.error('Error fetching tax pro requests:', error)
    throw new Error('Failed to fetch document requests')
  }

  return data.map(req => ({
    id: req.id,
    clientId: req.client_id,
    taxProfessionalId: req.tax_professional_id,
    documentType: req.document_type,
    description: req.description,
    priority: req.priority,
    status: req.status,
    dueDate: req.due_date,
    requestedAt: req.requested_at,
    fulfilledAt: req.fulfilled_at,
    notes: req.notes,
    clientNotes: req.client_notes,
    fileId: req.file_id,
    clientName: req.clients?.users?.name,
    uploadedFileName: req.files?.name,
    uploadedFileType: req.files?.type,
    uploadedFileSize: req.files?.size,
  }))
}

export async function createDocumentRequest(data: {
  clientId: string
  taxProfessionalId: string
  documentType: string
  description: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  dueDate: string
  notes?: string
}): Promise<DocumentRequest> {
  const supabase = createClient()

  const { data: request, error } = await supabase
    .from('document_requests')
    .insert({
      client_id: data.clientId,
      tax_professional_id: data.taxProfessionalId,
      document_type: data.documentType,
      description: data.description,
      priority: data.priority,
      due_date: data.dueDate,
      notes: data.notes,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating document request:', error)
    throw new Error('Failed to create document request')
  }

  return {
    id: request.id,
    clientId: request.client_id,
    taxProfessionalId: request.tax_professional_id,
    documentType: request.document_type,
    description: request.description,
    priority: request.priority,
    status: request.status,
    dueDate: request.due_date,
    requestedAt: request.requested_at,
    notes: request.notes,
  }
}

export async function fulfillDocumentRequest(
  requestId: string,
  fileId: string,
  clientNotes?: string
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('document_requests')
    .update({
      file_id: fileId,
      client_notes: clientNotes,
      // Status and fulfilled_at are set automatically by trigger
    })
    .eq('id', requestId)

  if (error) {
    console.error('Error fulfilling document request:', error)
    throw new Error('Failed to fulfill document request')
  }
}

export async function approveDocumentRequest(requestId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('document_requests')
    .update({ status: 'approved' })
    .eq('id', requestId)

  if (error) {
    console.error('Error approving document request:', error)
    throw new Error('Failed to approve document request')
  }
}

export async function rejectDocumentRequest(requestId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('document_requests')
    .update({
      status: 'rejected',
      file_id: null,
      fulfilled_at: null,
    })
    .eq('id', requestId)

  if (error) {
    console.error('Error rejecting document request:', error)
    throw new Error('Failed to reject document request')
  }
}
