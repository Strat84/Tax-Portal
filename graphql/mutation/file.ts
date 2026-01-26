export const CREATE_FILE = `
mutation createFile($input: CreateFileInput!) {
  createFile(
    input: $input
  ) {
    PK
    SK
    createdAt
    fileType
    fullPath
    isDeleted
    mimeType
    oldS3Key
    name
    parentPath
    s3Key
    size
    type
    totalFiles
    updatedAt
  }
}
`;

export const UPDATE_FILE = `
mutation updateFile($input: UpdateFileInput!) {
  updateFile(input: $input) {
    PK
    SK
    createdAt
    fileType
    fullPath
    isDeleted
    mimeType
    oldS3Key
    name
    parentPath
    s3Key
    size
    type
    updatedAt
  }
}`;



export const DELETE_FILE = `
mutation deleteFile($fullPath: String!) {
  deleteFile(fullPath: $fullPath) {
    message
    deletedCount
    success
  }
}
`;


