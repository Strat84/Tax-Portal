export const SEARCH_FILE = `
query searchFiles($searchTerm: String!, $userId: ID, $limit: Int, $nextToken: String) {
  searchFiles(searchTerm: $searchTerm, userId: $userId, limit: $limit, nextToken: $nextToken) {
    count
    nextToken
    items {
      PK
      SK
      createdAt
      fileType
      fullPath
      isDeleted
      mimeType
      name
      parentPath
      s3Key
      oldS3Key
      size
      type
      totalFiles
      updatedAt
    }
  }
}
`;


export const GET_FOLDER = `
query getFolder($limit: Int, $userId: ID, $nextToken: String, $parentPath: String) {
  getFolder(limit: $limit, userId: $userId, nextToken: $nextToken, parentPath: $parentPath) {
    count
    items {
      PK
      SK
      createdAt
      fileType
      fullPath
      isDeleted
      mimeType
      name
      parentPath
      s3Key
      oldS3Key
      size
      type
      totalFiles
      updatedAt
    }
    nextToken
  }
}
`;