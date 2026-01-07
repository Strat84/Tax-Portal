import { uploadData } from 'aws-amplify/storage';
import { v4 as uuidv4 } from 'uuid';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface FileUploadResult {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
}

export const ALLOWED_FILE_TYPES = {
  images: ['image/png', 'image/jpeg', 'image/jpg'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const isValidFileType = (file: File): boolean => {
  const allAllowedTypes = [...ALLOWED_FILE_TYPES.images, ...ALLOWED_FILE_TYPES.documents];
  return allAllowedTypes.includes(file.type);
};

export const isImageFile = (file: File): boolean => {
  return ALLOWED_FILE_TYPES.images.includes(file.type);
};

export const getFileExtension = (filename: string): string => {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
};

export const uploadFileToS3 = async (
  file: File,
  conversationId: string,
  messageId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<FileUploadResult> => {
  // Validate file type
  if (!isValidFileType(file)) {
    throw new Error('Invalid file type. Allowed types: PNG, JPEG, PDF, Word, Excel');
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 10MB limit');
  }

  // Generate unique file ID
  const fileId = uuidv4();
  const extension = getFileExtension(file.name);
  const fileName = `${fileId}.${extension}`;

  // S3 path: conversationId/messageId/fileName
  const s3Path = `conversations/${conversationId}/${messageId}/${fileName}`;

  try {
    // Upload file with progress tracking
    const uploadTask = uploadData({
      path: s3Path,
      data: file,
      options: {
        contentType: file.type,
        onProgress: (event) => {
          if (onProgress && event.totalBytes) {
            const progress: UploadProgress = {
              loaded: event.transferredBytes || 0,
              total: event.totalBytes || 0,
              percentage: event.totalBytes ? Math.round(((event.transferredBytes || 0) / event.totalBytes) * 100) : 0,
            };
            onProgress(progress);
          }
        },
      },
    });

    const result = await uploadTask.result;

    // Return file metadata with path (not full S3 URL)
    return {
      id: fileId,
      name: file.name,
      type: file.type,
      url: s3Path, // Store path only, will be concatenated with S3 URL when retrieving
      size: file.size,
    };
  } catch (error) {
    console.error('File upload error:', error);
    throw new Error('Failed to upload file. Please try again.');
  }
};

export const getFileDisplayName = (filename: string, maxLength: number = 30): string => {
  if (filename.length <= maxLength) return filename;

  const extension = getFileExtension(filename);
  const nameWithoutExt = filename.slice(0, filename.lastIndexOf('.'));
  const truncatedName = nameWithoutExt.slice(0, maxLength - extension.length - 4) + '...';

  return `${truncatedName}.${extension}`;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
