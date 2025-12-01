-- Add file_id column to document_requests to track uploaded files
ALTER TABLE document_requests
ADD COLUMN file_id UUID REFERENCES files(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX idx_document_requests_file_id ON document_requests(file_id);

-- Add a notes column for tax pro to client communication
ALTER TABLE document_requests
ADD COLUMN notes TEXT;

-- Add a client_notes column for client responses
ALTER TABLE document_requests
ADD COLUMN client_notes TEXT;

-- Update the status check constraint to include new statuses
ALTER TABLE document_requests
DROP CONSTRAINT IF EXISTS document_requests_status_check;

ALTER TABLE document_requests
ADD CONSTRAINT document_requests_status_check
CHECK (status IN ('pending', 'uploaded', 'approved', 'rejected', 'cancelled'));

-- Create a function to automatically update status when file is uploaded
CREATE OR REPLACE FUNCTION update_document_request_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.file_id IS NOT NULL AND OLD.file_id IS NULL THEN
    NEW.status := 'uploaded';
    NEW.fulfilled_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic status update
CREATE TRIGGER document_request_file_upload
  BEFORE UPDATE ON document_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_document_request_status();

COMMENT ON COLUMN document_requests.file_id IS 'Reference to the uploaded file that fulfills this request';
COMMENT ON COLUMN document_requests.notes IS 'Instructions from tax professional to client';
COMMENT ON COLUMN document_requests.client_notes IS 'Notes from client when uploading document';
