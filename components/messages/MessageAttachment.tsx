'use client'

import { Attachment } from '@/graphql/types/message'
import { getFileDisplayName, formatFileSize, isImageFile } from '@/lib/storage/fileUpload'
import awsconfig from '@/src/aws-exports'

interface MessageAttachmentProps {
  attachment: Attachment
  isFromCurrentUser: boolean
}

export default function MessageAttachment({ attachment, isFromCurrentUser }: MessageAttachmentProps) {
  // Construct full S3 URL
  const s3Bucket = awsconfig.aws_user_files_s3_bucket
  const s3Region = awsconfig.aws_user_files_s3_bucket_region
  const fullUrl = `https://${s3Bucket}.s3.${s3Region}.amazonaws.com/${attachment.url}`

  // Check if it's an image based on type
  const isImage = attachment.type.startsWith('image/')

  const handleDownload = () => {
    window.open(fullUrl, '_blank')
  }

  if (isImage) {
    return (
      <div className="mt-2">
        <div
          className={`relative rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity ${
            isFromCurrentUser ? 'bg-primary/10' : 'bg-slate-100 dark:bg-slate-800'
          }`}
          onClick={handleDownload}
        >
          <img
            src={fullUrl}
            alt={attachment.name}
            className="max-w-[300px] max-h-[300px] object-contain"
            loading="lazy"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2">
            <p className="truncate">{getFileDisplayName(attachment.name)}</p>
            {attachment.size && <p>{formatFileSize(attachment.size)}</p>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-2">
      <button
        onClick={handleDownload}
        className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
          isFromCurrentUser
            ? 'bg-primary-foreground/10 hover:bg-primary-foreground/20'
            : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'
        }`}
      >
        <div className="flex-shrink-0">
          <svg
            className={`h-8 w-8 ${
              isFromCurrentUser ? 'text-primary-foreground' : 'text-muted-foreground'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className={`text-sm font-medium truncate ${
            isFromCurrentUser ? 'text-primary-foreground' : ''
          }`}>
            {getFileDisplayName(attachment.name)}
          </p>
          {attachment.size && (
            <p className={`text-xs ${
              isFromCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
            }`}>
              {formatFileSize(attachment.size)}
            </p>
          )}
        </div>
        <div className="flex-shrink-0">
          <svg
            className={`h-5 w-5 ${
              isFromCurrentUser ? 'text-primary-foreground' : 'text-muted-foreground'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        </div>
      </button>
    </div>
  )
}
