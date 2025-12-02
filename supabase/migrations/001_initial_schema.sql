-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (synced from Cognito)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cognito_user_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'tax_pro', 'client')),
  name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);

-- Create index on cognito_user_id for faster lookups
CREATE INDEX idx_users_cognito_user_id ON users(cognito_user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Tax professionals (additional data for tax pros)
CREATE TABLE tax_professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  license_number TEXT,
  specializations TEXT[],
  max_clients INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_tax_pros_user_id ON tax_professionals(user_id);

-- Clients (additional data for clients)
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assigned_tax_pro_id UUID REFERENCES tax_professionals(id),
  tax_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
  address JSONB,
  profile_data JSONB,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_tax_pro FOREIGN KEY (assigned_tax_pro_id) REFERENCES tax_professionals(id)
);

CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_clients_assigned_tax_pro_id ON clients(assigned_tax_pro_id);

-- Folders (for organizing files)
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  folder_name TEXT NOT NULL,
  folder_path TEXT NOT NULL,
  parent_folder_id UUID REFERENCES folders(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  CONSTRAINT fk_client FOREIGN KEY (client_id) REFERENCES clients(id),
  CONSTRAINT fk_parent_folder FOREIGN KEY (parent_folder_id) REFERENCES folders(id),
  CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_folders_client_id ON folders(client_id);
CREATE INDEX idx_folders_parent_folder_id ON folders(parent_folder_id);

-- Files metadata
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES users(id),
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  folder_path TEXT DEFAULT '/',
  file_size BIGINT,
  file_type TEXT,
  tags TEXT[],
  version_number INTEGER DEFAULT 1,
  parent_file_id UUID REFERENCES files(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_client FOREIGN KEY (client_id) REFERENCES clients(id),
  CONSTRAINT fk_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id),
  CONSTRAINT fk_parent_file FOREIGN KEY (parent_file_id) REFERENCES files(id)
);

CREATE INDEX idx_files_client_id ON files(client_id);
CREATE INDEX idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX idx_files_folder_path ON files(folder_path);
CREATE INDEX idx_files_tags ON files USING GIN(tags);

-- Conversations (message threads)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  client_id UUID REFERENCES clients(id),
  tax_pro_id UUID REFERENCES tax_professionals(id),
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_client FOREIGN KEY (client_id) REFERENCES clients(id),
  CONSTRAINT fk_tax_pro FOREIGN KEY (tax_pro_id) REFERENCES tax_professionals(id)
);

CREATE INDEX idx_conversations_client_id ON conversations(client_id);
CREATE INDEX idx_conversations_tax_pro_id ON conversations(tax_pro_id);
CREATE INDEX idx_conversations_archived ON conversations(archived);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  recipient_id UUID REFERENCES users(id),
  message_text TEXT NOT NULL,
  attachments JSONB,
  read_status BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id),
  CONSTRAINT fk_sender FOREIGN KEY (sender_id) REFERENCES users(id),
  CONSTRAINT fk_recipient FOREIGN KEY (recipient_id) REFERENCES users(id)
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_read_status ON messages(read_status);

-- Document requests
CREATE TABLE document_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  tax_pro_id UUID REFERENCES tax_professionals(id),
  document_name TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'overdue')),
  fulfilled_file_id UUID REFERENCES files(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  fulfilled_at TIMESTAMPTZ,
  CONSTRAINT fk_client FOREIGN KEY (client_id) REFERENCES clients(id),
  CONSTRAINT fk_tax_pro FOREIGN KEY (tax_pro_id) REFERENCES tax_professionals(id),
  CONSTRAINT fk_fulfilled_file FOREIGN KEY (fulfilled_file_id) REFERENCES files(id)
);

CREATE INDEX idx_document_requests_client_id ON document_requests(client_id);
CREATE INDEX idx_document_requests_tax_pro_id ON document_requests(tax_pro_id);
CREATE INDEX idx_document_requests_status ON document_requests(status);
CREATE INDEX idx_document_requests_due_date ON document_requests(due_date);

-- Client status tracking
CREATE TABLE client_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  status TEXT NOT NULL CHECK (status IN (
    'documents_pending',
    'documents_received',
    'in_progress',
    'ready_for_review',
    'filed',
    'complete'
  )),
  notes TEXT,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_client FOREIGN KEY (client_id) REFERENCES clients(id),
  CONSTRAINT fk_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE INDEX idx_client_status_client_id ON client_status(client_id);
CREATE INDEX idx_client_status_status ON client_status(status);

-- E-signatures
CREATE TABLE signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  document_id UUID REFERENCES files(id),
  signature_image_path TEXT NOT NULL,
  signed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  CONSTRAINT fk_client FOREIGN KEY (client_id) REFERENCES clients(id),
  CONSTRAINT fk_document FOREIGN KEY (document_id) REFERENCES files(id)
);

CREATE INDEX idx_signatures_client_id ON signatures(client_id);
CREATE INDEX idx_signatures_document_id ON signatures(document_id);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read_status BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read_status ON notifications(read_status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Audit logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create default folder structure for new clients
CREATE OR REPLACE FUNCTION create_default_folders_for_client()
RETURNS TRIGGER AS $$
DECLARE
    tax_folder_id UUID;
BEGIN
    -- Create the main tax year folder
    INSERT INTO folders (client_id, folder_name, folder_path, created_by)
    VALUES (NEW.id, CONCAT(NEW.tax_year, '-Tax'), CONCAT('/', NEW.tax_year, '-Tax'), NEW.user_id)
    RETURNING id INTO tax_folder_id;

    -- Create subfolders
    INSERT INTO folders (client_id, folder_name, folder_path, parent_folder_id, created_by)
    VALUES
        (NEW.id, 'W2s', CONCAT('/', NEW.tax_year, '-Tax/W2s'), tax_folder_id, NEW.user_id),
        (NEW.id, '1099s', CONCAT('/', NEW.tax_year, '-Tax/1099s'), tax_folder_id, NEW.user_id),
        (NEW.id, 'Receipts', CONCAT('/', NEW.tax_year, '-Tax/Receipts'), tax_folder_id, NEW.user_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create folders for new clients
CREATE TRIGGER create_folders_on_client_insert
    AFTER INSERT ON clients
    FOR EACH ROW
    EXECUTE FUNCTION create_default_folders_for_client();
