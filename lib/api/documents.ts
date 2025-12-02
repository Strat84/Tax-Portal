import { createClient } from '@/lib/db/supabase'

export interface Document {
  id: string
  userId: string
  folderId: string | null
  name: string
  path: string
  size: number
  type: string
  uploadedAt: string
  tags?: string[]
}

export interface TaxProDocument extends Document {
  clientName: string
  clientId: string
}

export async function getDocuments(userId: string): Promise<Document[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('user_id', userId)
    .order('uploaded_at', { ascending: false })

  if (error) {
    console.error('Error fetching documents:', error)
    throw new Error('Failed to fetch documents')
  }

  return data.map(file => ({
    id: file.id,
    userId: file.user_id,
    folderId: file.folder_id,
    name: file.name,
    path: file.path,
    size: file.size,
    type: file.type,
    uploadedAt: file.uploaded_at,
    tags: [], // TODO: Implement tags system
  }))
}

export async function getDocumentUrl(path: string): Promise<string> {
  const supabase = createClient()

  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(path, 3600) // 1 hour expiry

  if (error) {
    console.error('Error getting document URL:', error)
    throw new Error('Failed to get document URL')
  }

  return data.signedUrl
}

export async function uploadDocument(
  file: File,
  userId: string,
  folderId: string | null = null
): Promise<Document> {
  const supabase = createClient()

  // Generate unique file path
  const timestamp = Date.now()
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const filePath = `${userId}/${timestamp}_${sanitizedName}`

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file)

  if (uploadError) {
    console.error('Error uploading file:', uploadError)
    throw new Error('Failed to upload file')
  }

  // Create file record in database
  const { data: fileRecord, error: fileError } = await supabase
    .from('files')
    .insert({
      user_id: userId,
      folder_id: folderId,
      name: file.name,
      path: uploadData.path,
      size: file.size,
      type: file.type,
    })
    .select()
    .single()

  if (fileError) {
    console.error('Error creating file record:', fileError)
    throw new Error('Failed to create file record')
  }

  return {
    id: fileRecord.id,
    userId: fileRecord.user_id,
    folderId: fileRecord.folder_id,
    name: fileRecord.name,
    path: fileRecord.path,
    size: fileRecord.size,
    type: fileRecord.type,
    uploadedAt: fileRecord.uploaded_at,
    tags: [],
  }
}

export async function deleteDocument(fileId: string, filePath: string): Promise<void> {
  const supabase = createClient()

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('documents')
    .remove([filePath])

  if (storageError) {
    console.error('Error deleting file from storage:', storageError)
    throw new Error('Failed to delete file from storage')
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from('files')
    .delete()
    .eq('id', fileId)

  if (dbError) {
    console.error('Error deleting file record:', dbError)
    throw new Error('Failed to delete file record')
  }
}

export async function getTaxProDocuments(taxProId: string): Promise<TaxProDocument[]> {
  const supabase = createClient()

  // Get all documents from clients assigned to this tax pro
  const { data, error } = await supabase
    .from('files')
    .select(`
      *,
      user:users!files_user_id_fkey (
        id,
        name,
        client:clients!clients_user_id_fkey (
          id,
          tax_pro_id
        )
      )
    `)
    .order('uploaded_at', { ascending: false })

  if (error) {
    console.error('Error fetching tax pro documents:', error)
    throw new Error('Failed to fetch documents')
  }

  // Filter for documents from clients assigned to this tax pro
  const filtered = data.filter(file => {
    const client = file.user?.client?.[0]
    return client && client.tax_pro_id === taxProId
  })

  return filtered.map(file => ({
    id: file.id,
    userId: file.user_id,
    folderId: file.folder_id,
    name: file.name,
    path: file.path,
    size: file.size,
    type: file.type,
    uploadedAt: file.uploaded_at,
    tags: [],
    clientName: file.user?.name || 'Unknown Client',
    clientId: file.user?.client?.[0]?.id || '',
  }))
}
