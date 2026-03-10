'use client'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import FileAttachment, { FilePreviewCard } from '@/components/messages/FileAttachment'
import { MessageInputAreaProps, FilePreview } from '@/graphql/types/message'

export default function MessageInputArea({
  message,
  onMessageChange,
  onKeyDown,
  filePreview,
  onFileSelect,
  onRemoveFile,
  onSend,
  loading,
}: MessageInputAreaProps) {
  const isDisabled = loading || filePreview?.uploading

  return (
    <div className="border-t p-4 flex-shrink-0">
      {/* File Preview */}
      {filePreview && (
        <FilePreviewCard
          filePreview={filePreview}
          onRemove={onRemoveFile}
        />
      )}

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Textarea
            placeholder="Type your message..."
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyDown={onKeyDown}
            rows={3}
            className="resize-none"
            disabled={isDisabled}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <FileAttachment
            onFileSelect={onFileSelect}
            onRemove={onRemoveFile}
            disabled={loading || !!filePreview}
          />
          <Button
            onClick={onSend}
            size="icon"
            disabled={
              loading ||
              filePreview?.uploading ||
              (!message.trim() && !filePreview)
            }
          >
            {loading || filePreview?.uploading ? (
              <svg
                className="h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
