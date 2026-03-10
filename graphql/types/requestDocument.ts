
export interface DocumentRequest {
  PK: string
  SK: string
  clientId: string
  clientNotes?: string
  createdAt: string
  description: string
  documentRequestId: string
  documentType: string
  dueDate: string
  fulfilledAt?: string
  notes?: string
  priority: string
  status: string
  taxProfessionalId?: string
  updatedAt: string
  clientName?: {
    address?: string
    createdAt: string
    documentsUploaded?: number
    email: string
    id: string
    isActive: boolean
    lastActiveAt?: string
    lastLogin?: string
    name: string
    pendingRequest?: number
    phone?: string
    role: string
    ssn?: string
    status?: string
    taxReturnStatus?: string
    unreadMessages?: number
    updatedAt: string
  }
  taxProName?: {
    address?: string
    createdAt: string
    documentsUploaded?: number
    email: string
    id: string
    isActive: boolean
    lastActiveAt?: string
    lastLogin?: string
    name: string
    pendingRequest?: number
    phone?: string
    role: string
    ssn?: string
    status?: string
    taxReturnStatus?: string
    updatedAt: string
    unreadMessages?: number
  }
}

export interface GetRequestsResponse {
  getClientRequests?: {
    count: number
    nextToken?: string
    items: DocumentRequest[]
  }
  getTaxProRequests?: {
    count: number
    nextToken?: string
    items: DocumentRequest[]
  }
}

export interface CreateRequestResponse {
  createDocumentRequest: DocumentRequest
}

export interface UpdateRequestResponse {
  updateDocumentRequest: DocumentRequest
}

export interface DocumentRequestForm {
  documentType: string
  description: string
  priority: string
  dueDate: string
  notes: string
}