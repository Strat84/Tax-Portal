-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's ID from cognito_user_id
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
  SELECT id FROM users WHERE cognito_user_id = auth.jwt() ->> 'sub';
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE cognito_user_id = auth.jwt() ->> 'sub'
    AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to check if current user is tax pro
CREATE OR REPLACE FUNCTION is_tax_pro()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE cognito_user_id = auth.jwt() ->> 'sub'
    AND role = 'tax_pro'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to get tax pro ID for current user
CREATE OR REPLACE FUNCTION get_current_tax_pro_id()
RETURNS UUID AS $$
  SELECT tp.id FROM tax_professionals tp
  JOIN users u ON u.id = tp.user_id
  WHERE u.cognito_user_id = auth.jwt() ->> 'sub';
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to get client ID for current user
CREATE OR REPLACE FUNCTION get_current_client_id()
RETURNS UUID AS $$
  SELECT c.id FROM clients c
  JOIN users u ON u.id = c.user_id
  WHERE u.cognito_user_id = auth.jwt() ->> 'sub';
$$ LANGUAGE SQL SECURITY DEFINER;

-- USERS TABLE POLICIES
-- Users can view their own record, admins can view all
CREATE POLICY "Users can view own record" ON users
  FOR SELECT USING (
    cognito_user_id = auth.jwt() ->> 'sub' OR is_admin()
  );

-- Only admins can insert users (via Lambda trigger)
CREATE POLICY "Only admins can insert users" ON users
  FOR INSERT WITH CHECK (is_admin());

-- Users can update their own record, admins can update any
CREATE POLICY "Users can update own record" ON users
  FOR UPDATE USING (
    cognito_user_id = auth.jwt() ->> 'sub' OR is_admin()
  );

-- TAX_PROFESSIONALS TABLE POLICIES
-- Tax pros can view their own record, admins can view all
CREATE POLICY "Tax pros can view own record" ON tax_professionals
  FOR SELECT USING (
    user_id = get_current_user_id() OR is_admin()
  );

-- Admins can insert tax professionals
CREATE POLICY "Admins can insert tax pros" ON tax_professionals
  FOR INSERT WITH CHECK (is_admin());

-- CLIENTS TABLE POLICIES
-- Clients can view their own record
-- Tax pros can view their assigned clients
-- Admins can view all
CREATE POLICY "Clients can view own record" ON clients
  FOR SELECT USING (
    user_id = get_current_user_id() OR
    assigned_tax_pro_id = get_current_tax_pro_id() OR
    is_admin()
  );

-- Admins and tax pros can insert clients
CREATE POLICY "Admins and tax pros can insert clients" ON clients
  FOR INSERT WITH CHECK (is_admin() OR is_tax_pro());

-- Admins and assigned tax pros can update clients
CREATE POLICY "Admins and assigned tax pros can update clients" ON clients
  FOR UPDATE USING (
    assigned_tax_pro_id = get_current_tax_pro_id() OR is_admin()
  );

-- FOLDERS TABLE POLICIES
-- Clients can view their own folders
-- Tax pros can view folders of assigned clients
-- Admins can view all
CREATE POLICY "View folders policy" ON folders
  FOR SELECT USING (
    client_id = get_current_client_id() OR
    client_id IN (
      SELECT id FROM clients WHERE assigned_tax_pro_id = get_current_tax_pro_id()
    ) OR
    is_admin()
  );

-- Clients and their tax pros can create folders
CREATE POLICY "Create folders policy" ON folders
  FOR INSERT WITH CHECK (
    client_id = get_current_client_id() OR
    client_id IN (
      SELECT id FROM clients WHERE assigned_tax_pro_id = get_current_tax_pro_id()
    ) OR
    is_admin()
  );

-- Clients and their tax pros can delete their folders
CREATE POLICY "Delete folders policy" ON folders
  FOR DELETE USING (
    client_id = get_current_client_id() OR
    client_id IN (
      SELECT id FROM clients WHERE assigned_tax_pro_id = get_current_tax_pro_id()
    ) OR
    is_admin()
  );

-- FILES TABLE POLICIES
-- Clients can view their own files
-- Tax pros can view files of assigned clients
-- Admins can view all
CREATE POLICY "View files policy" ON files
  FOR SELECT USING (
    client_id = get_current_client_id() OR
    client_id IN (
      SELECT id FROM clients WHERE assigned_tax_pro_id = get_current_tax_pro_id()
    ) OR
    is_admin()
  );

-- Clients and their tax pros can upload files
CREATE POLICY "Upload files policy" ON files
  FOR INSERT WITH CHECK (
    client_id = get_current_client_id() OR
    client_id IN (
      SELECT id FROM clients WHERE assigned_tax_pro_id = get_current_tax_pro_id()
    ) OR
    is_admin()
  );

-- Clients and their tax pros can update file metadata
CREATE POLICY "Update files policy" ON files
  FOR UPDATE USING (
    client_id = get_current_client_id() OR
    client_id IN (
      SELECT id FROM clients WHERE assigned_tax_pro_id = get_current_tax_pro_id()
    ) OR
    is_admin()
  );

-- Clients and their tax pros can delete files
CREATE POLICY "Delete files policy" ON files
  FOR DELETE USING (
    client_id = get_current_client_id() OR
    client_id IN (
      SELECT id FROM clients WHERE assigned_tax_pro_id = get_current_tax_pro_id()
    ) OR
    is_admin()
  );

-- CONVERSATIONS TABLE POLICIES
-- Clients can view conversations they're part of
-- Tax pros can view conversations with their clients
-- Admins can view all
CREATE POLICY "View conversations policy" ON conversations
  FOR SELECT USING (
    client_id = get_current_client_id() OR
    tax_pro_id = get_current_tax_pro_id() OR
    is_admin()
  );

-- Clients and tax pros can create conversations
CREATE POLICY "Create conversations policy" ON conversations
  FOR INSERT WITH CHECK (
    client_id = get_current_client_id() OR
    tax_pro_id = get_current_tax_pro_id() OR
    is_admin()
  );

-- MESSAGES TABLE POLICIES
-- Users can view messages in conversations they're part of
CREATE POLICY "View messages policy" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE client_id = get_current_client_id()
         OR tax_pro_id = get_current_tax_pro_id()
    ) OR
    sender_id = get_current_user_id() OR
    recipient_id = get_current_user_id() OR
    is_admin()
  );

-- Users can send messages
CREATE POLICY "Send messages policy" ON messages
  FOR INSERT WITH CHECK (
    sender_id = get_current_user_id()
  );

-- Users can update their own messages (mark as read)
CREATE POLICY "Update messages policy" ON messages
  FOR UPDATE USING (
    recipient_id = get_current_user_id() OR
    sender_id = get_current_user_id() OR
    is_admin()
  );

-- DOCUMENT_REQUESTS TABLE POLICIES
-- Clients can view their own document requests
-- Tax pros can view requests for their clients
-- Admins can view all
CREATE POLICY "View document requests policy" ON document_requests
  FOR SELECT USING (
    client_id = get_current_client_id() OR
    tax_pro_id = get_current_tax_pro_id() OR
    is_admin()
  );

-- Tax pros can create document requests
CREATE POLICY "Create document requests policy" ON document_requests
  FOR INSERT WITH CHECK (
    tax_pro_id = get_current_tax_pro_id() OR is_admin()
  );

-- Tax pros and clients can update document requests
CREATE POLICY "Update document requests policy" ON document_requests
  FOR UPDATE USING (
    tax_pro_id = get_current_tax_pro_id() OR
    client_id = get_current_client_id() OR
    is_admin()
  );

-- CLIENT_STATUS TABLE POLICIES
-- Clients can view their own status
-- Tax pros can view status of their clients
-- Admins can view all
CREATE POLICY "View client status policy" ON client_status
  FOR SELECT USING (
    client_id = get_current_client_id() OR
    client_id IN (
      SELECT id FROM clients WHERE assigned_tax_pro_id = get_current_tax_pro_id()
    ) OR
    is_admin()
  );

-- Tax pros can create and update status
CREATE POLICY "Create client status policy" ON client_status
  FOR INSERT WITH CHECK (
    is_tax_pro() OR is_admin()
  );

CREATE POLICY "Update client status policy" ON client_status
  FOR UPDATE USING (
    is_tax_pro() OR is_admin()
  );

-- SIGNATURES TABLE POLICIES
-- Clients can view their own signatures
-- Tax pros can view signatures of their clients
-- Admins can view all
CREATE POLICY "View signatures policy" ON signatures
  FOR SELECT USING (
    client_id = get_current_client_id() OR
    client_id IN (
      SELECT id FROM clients WHERE assigned_tax_pro_id = get_current_tax_pro_id()
    ) OR
    is_admin()
  );

-- Clients can create their own signatures
CREATE POLICY "Create signatures policy" ON signatures
  FOR INSERT WITH CHECK (
    client_id = get_current_client_id()
  );

-- NOTIFICATIONS TABLE POLICIES
-- Users can view their own notifications
CREATE POLICY "View notifications policy" ON notifications
  FOR SELECT USING (
    user_id = get_current_user_id()
  );

-- System can insert notifications for users
CREATE POLICY "Create notifications policy" ON notifications
  FOR INSERT WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Update notifications policy" ON notifications
  FOR UPDATE USING (
    user_id = get_current_user_id()
  );

-- Users can delete their own notifications
CREATE POLICY "Delete notifications policy" ON notifications
  FOR DELETE USING (
    user_id = get_current_user_id()
  );

-- AUDIT_LOGS TABLE POLICIES
-- Admins can view all audit logs
-- Tax pros can view logs related to their clients
-- Clients can view their own logs
CREATE POLICY "View audit logs policy" ON audit_logs
  FOR SELECT USING (
    user_id = get_current_user_id() OR
    is_tax_pro() OR
    is_admin()
  );

-- System can insert audit logs
CREATE POLICY "Create audit logs policy" ON audit_logs
  FOR INSERT WITH CHECK (true);
