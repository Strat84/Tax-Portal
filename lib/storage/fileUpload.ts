import { uploadData, downloadData, remove, getUrl, list } from 'aws-amplify/storage';
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

/**
 * Download a file from S3
 * @param path - S3 path of the file to download
 * @returns Blob of the downloaded file
 */
export const downloadFile = async (path: string): Promise<Blob> => {
  try {
    const result = await downloadData({
      path,
    }).result;

    // Convert body to Blob
    const blob = await result.body.blob();
    return blob;
  } catch (error) {
    console.error('File download error:', error);
    throw new Error('Failed to download file. Please try again.');
  }
};

/**
 * Delete a file from S3
 * @param path - S3 path of the file to delete
 */
export const deleteFile = async (path: string): Promise<void> => {
  try {
    await remove({
      path,
    });
  } catch (error) {
    console.error('File delete error:', error);
    throw new Error('Failed to delete file. Please try again.');
  }
};

/**
 * Get a presigned URL for file preview/access
 * @param path - S3 path of the file
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns Presigned URL for the file
 */
export const getFileUrlForPreview = async (
  path: string,
  expiresIn: number = 3600
): Promise<string> => {
  try {
    const result = await getUrl({
      path,
      options: {
        expiresIn, // URL valid for specified seconds
      },
    });

    return result.url.toString();
  } catch (error) {
    console.error('Get file URL error:', error);
    throw new Error('Failed to get file URL. Please try again.');
  }
};

/**
 * Create a folder structure in S3 by uploading a placeholder file
 * @param folderPath - Path of the folder to create (e.g., "users/123/documents")
 * @returns The folder path
 */
export const createFolderPath = async (folderPath: string): Promise<string> => {
  try {
    // S3 doesn't have true folders, but we can create the structure
    // by uploading a small placeholder file
    const placeholderPath = `${folderPath.replace(/\/$/, '')}/.folder`;

    await uploadData({
      path: placeholderPath,
      data: new Blob([''], { type: 'text/plain' }),
    }).result;

    return folderPath;
  } catch (error) {
    console.error('Create folder error:', error);
    throw new Error('Failed to create folder. Please try again.');
  }
};

/**
 * List files in a folder
 * @param folderPath - Path of the folder to list
 * @returns Array of file items with metadata
 */
export const listFilesInFolder = async (folderPath: string) => {
  try {
    const result = await list({
      path: folderPath,
    });

    return result.items;
  } catch (error) {
    console.error('List files error:', error);
    throw new Error('Failed to list files. Please try again.');
  }
};

/**
 * File upload result with database entry
 */
export interface FileUploadWithDBResult {
  file: File;
  s3Key: string;
  fullPath: string;
  name: string;
  type: 'FILE' | 'IMAGE';
  mimeType: string;
  size: number;
  fileType?: string;
}

/**
 * Progress callback for individual file
 */
export interface FileProgressCallback {
  (fileIndex: number, fileName: string, progress: UploadProgress): void;
}

/**
 * Upload multiple files to S3 with individual progress tracking
 * @param files - Array of files to upload
 * @param userId - User ID for folder structure
 * @param parentPath - Parent folder path (null for root)
 * @param onFileProgress - Callback for individual file progress
 * @returns Array of upload results
 */
export const uploadMultipleFilesToS3 = async (
  files: File[],
  userId: string,
  parentPath: string | null,
  onFileProgress?: FileProgressCallback
): Promise<FileUploadWithDBResult[]> => {
  const results: FileUploadWithDBResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    try {
      // Build S3 path: private/{userId}/{parentPath}/{filename}
      let fullPath = `private/${userId}`;

      // Clean up parentPath - remove leading/trailing slashes
      const cleanParentPath = parentPath?.replace(/^\/+|\/+$/g, '');

      if (cleanParentPath && cleanParentPath !== '') {
        fullPath = `${fullPath}/${cleanParentPath}`;
      }

      fullPath = `${fullPath}/${file.name}`;

      // Determine file type (IMAGE or FILE)
      const fileType = file.type.startsWith('image/') ? 'IMAGE' : 'FILE';

      // Upload to S3 with progress tracking
      const uploadTask = uploadData({
        path: fullPath,
        data: file,
        options: {
          contentType: file.type,
          onProgress: (event) => {
            if (onFileProgress && event.totalBytes) {
              const progress: UploadProgress = {
                loaded: event.transferredBytes || 0,
                total: event.totalBytes || 0,
                percentage: event.totalBytes
                  ? Math.round(((event.transferredBytes || 0) / event.totalBytes) * 100)
                  : 0,
              };
              onFileProgress(i, file.name, progress);
            }
          },
        },
      });

      await uploadTask.result;

      // Prepare result
      results.push({
        file,
        s3Key: fullPath,
        fullPath,
        name: file.name,
        type: fileType,
        mimeType: file.type,
        size: file.size,
        fileType: file.type,
      });

      // Mark file as 100% complete
      if (onFileProgress) {
        onFileProgress(i, file.name, {
          loaded: file.size,
          total: file.size,
          percentage: 100,
        });
      }
    } catch (error) {
      console.error(`Failed to upload file ${file.name}:`, error);
      throw new Error(`Failed to upload ${file.name}. Please try again.`);
    }
  }

  return results;
};

/**
 * Rename a file or folder in S3
 * @param oldS3Key - Current S3 path of the file/folder
 * @param newName - New name for the file/folder
 * @param isFolder - Whether the item is a folder
 * @returns New S3 path after rename
 */
export const renameFileOrFolder = async (
  oldS3Key: string,
  newName: string,
  isFolder: boolean = false
): Promise<string> => {
  try {
    console.log('Renaming:', { oldS3Key, newName, isFolder });

    // Handle folder path (ends with /)
    if (isFolder) {
      // Remove trailing slash if exists
      const cleanOldPath = oldS3Key.endsWith('/') ? oldS3Key.slice(0, -1) : oldS3Key;
      const pathParts = cleanOldPath.split('/');
      pathParts.pop(); // Remove current folder name
      const parentPath = pathParts.join('/');
      const newS3Key = parentPath ? `${parentPath}/${newName}/` : `${newName}/`;

      console.log('Renaming folder from', oldS3Key, 'to', newS3Key);

      // Rename folder by moving all contents
      await renameFolderContents(oldS3Key, newS3Key);

      return newS3Key;
    }

    // Handle file rename
    const pathParts = oldS3Key.split('/');
    pathParts.pop(); // Remove current filename
    const parentPath = pathParts.join('/');
    const newS3Key = parentPath ? `${parentPath}/${newName}` : newName;

    console.log('Renaming file from', oldS3Key, 'to', newS3Key);

    // Download file data
    const downloadResult = await downloadData({
      path: oldS3Key,
    }).result;

    const fileBlob = await downloadResult.body.blob();

    // Upload to new location
    await uploadData({
      path: newS3Key,
      data: fileBlob,
      options: {
        contentType: downloadResult.contentType,
      },
    }).result;

    console.log('File uploaded to new location:', newS3Key);

    // Delete old file
    await remove({
      path: oldS3Key,
    });

    console.log('Old file deleted:', oldS3Key);

    return newS3Key;
  } catch (error) {
    console.error('Rename file/folder error:', error);
    throw new Error('Failed to rename. Please try again.');
  }
};

/**
 * Recursively rename folder contents
 * @param oldFolderPath - Old folder path
 * @param newFolderPath - New folder path
 */
const renameFolderContents = async (
  oldFolderPath: string,
  newFolderPath: string
): Promise<void> => {
  try {
    console.log('Renaming folder contents from', oldFolderPath, 'to', newFolderPath);

    // Ensure folder paths end with /
    const oldPath = oldFolderPath.endsWith('/') ? oldFolderPath : `${oldFolderPath}/`;
    const newPath = newFolderPath.endsWith('/') ? newFolderPath : `${newFolderPath}/`;

    // List all items in the folder
    const result = await list({
      path: oldPath,
      options: {
        listAll: true,
      },
    });

    console.log('Found items in folder:', result.items.length);

    // Process each item
    for (const item of result.items) {
      if (!item.path) continue;

      // Skip the .folder placeholder
      if (item.path.endsWith('.folder')) {
        console.log('Skipping placeholder:', item.path);
        continue;
      }

      // Calculate new path
      const relativePath = item.path.replace(oldPath, '');
      const newItemPath = `${newPath}${relativePath}`;

      console.log('Moving item from', item.path, 'to', newItemPath);

      // Download item
      const downloadResult = await downloadData({
        path: item.path,
      }).result;

      const itemBlob = await downloadResult.body.blob();

      // Upload to new location
      await uploadData({
        path: newItemPath,
        data: itemBlob,
        options: {
          contentType: downloadResult.contentType,
        },
      }).result;

      console.log('Item uploaded to:', newItemPath);

      // Delete old item
      await remove({
        path: item.path,
      });

      console.log('Old item deleted:', item.path);
    }

    // Create the new folder placeholder
    await uploadData({
      path: `${newPath}.folder`,
      data: new Blob([''], { type: 'text/plain' }),
    }).result;

    console.log('Folder rename complete');
  } catch (error) {
    console.error('Rename folder contents error:', error);
    throw new Error('Failed to rename folder contents. Please try again.');
  }
};

/**
 * Optimized rename for folder - First lists all files, then copies to new path, then deletes old path
 * @param oldS3Key - Current S3 path of the folder
 * @param newName - New name for the folder
 * @returns New S3 path after rename
 */
export const renameFolderOptimized = async (
  oldS3Key: string,
  newName: string
): Promise<string> => {
  try {
    console.log('🚀 Starting optimized folder rename:', { oldS3Key, newName });

    // Remove trailing slash if exists
    const cleanOldPath = oldS3Key.endsWith('/') ? oldS3Key.slice(0, -1) : oldS3Key;
    const pathParts = cleanOldPath.split('/');
    pathParts.pop(); // Remove current folder name
    const parentPath = pathParts.join('/');
    const newS3Key = parentPath ? `${parentPath}/${newName}/` : `${newName}/`;

    console.log('📂 New folder path will be:', newS3Key);

    // Ensure folder paths end with /
    const oldPath = oldS3Key.endsWith('/') ? oldS3Key : `${oldS3Key}/`;
    const newPath = newS3Key.endsWith('/') ? newS3Key : `${newS3Key}/`;

    // Step 1: List all items in the folder
    console.log('📋 Step 1: Listing all files in folder...');
    const result = await list({
      path: oldPath,
      options: {
        listAll: true,
      },
    });

    console.log(`✅ Found ${result.items.length} items in folder`);

    // Filter out .folder placeholders
    const itemsToMove = result.items.filter(item => item.path && !item.path.endsWith('.folder'));

    console.log(`📦 Will move ${itemsToMove.length} files`);

    // Step 2: Copy all files to new path
    console.log('📤 Step 2: Copying files to new location...');
    for (const item of itemsToMove) {
      if (!item.path) continue;

      const relativePath = item.path.replace(oldPath, '');
      const newItemPath = `${newPath}${relativePath}`;

      console.log(`  📄 Copying: ${item.path} → ${newItemPath}`);

      // Download item
      const downloadResult = await downloadData({
        path: item.path,
      }).result;

      const itemBlob = await downloadResult.body.blob();

      // Upload to new location
      await uploadData({
        path: newItemPath,
        data: itemBlob,
        options: {
          contentType: downloadResult.contentType,
        },
      }).result;

      console.log(`  ✅ Copied: ${newItemPath}`);
    }

    // Create the new folder placeholder
    console.log('📁 Creating folder placeholder...');
    await uploadData({
      path: `${newPath}.folder`,
      data: new Blob([''], { type: 'text/plain' }),
    }).result;

    // Step 3: Delete old files
    console.log('🗑️  Step 3: Deleting old files...');
    for (const item of itemsToMove) {
      if (!item.path) continue;

      console.log(`  🗑️  Deleting: ${item.path}`);
      await remove({
        path: item.path,
      });
      console.log(`  ✅ Deleted: ${item.path}`);
    }

    // Delete old folder placeholder
    try {
      await remove({
        path: `${oldPath}.folder`,
      });
      console.log('✅ Deleted old folder placeholder');
    } catch (err) {
      console.log('ℹ️  Old folder placeholder not found or already deleted');
    }

    console.log('🎉 Folder rename complete!');
    return newS3Key;
  } catch (error) {
    console.error('❌ Optimized folder rename error:', error);
    throw new Error('Failed to rename folder. Please try again.');
  }
};
