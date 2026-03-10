/**
 * DocumentRequestDialog component - for creating new document requests
 */

'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DOCUMENT_TYPES, PRIORITY_OPTIONS } from '../constants'
import type { DocumentRequestForm } from '@/graphql/types/requestDocument'

interface DocumentRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: DocumentRequestForm
  onFormChange: (form: DocumentRequestForm) => void
  onSubmit: () => Promise<boolean>
  isLoading: boolean
  canSubmit: boolean
}

export function DocumentRequestDialog({
  open,
  onOpenChange,
  form,
  onFormChange,
  onSubmit,
  isLoading,
  canSubmit,
}: DocumentRequestDialogProps) {
  const handleSubmit = async () => {
    const success = await onSubmit()
    if (success) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>New Document Request</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Document Request</DialogTitle>
          <DialogDescription>Request documents from the client</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Document Type */}
          <div className="space-y-2">
            <Label htmlFor="documentType">Document Type *</Label>
            <Select
              value={form.documentType}
              onValueChange={(value) =>
                onFormChange({ ...form, documentType: value })
              }
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((doc) => (
                  <SelectItem key={doc.value} value={doc.value}>
                    {doc.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Enter description"
              value={form.description}
              onChange={(e) =>
                onFormChange({ ...form, description: e.target.value })
              }
              disabled={isLoading}
              rows={3}
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority *</Label>
            <Select
              value={form.priority}
              onValueChange={(value) =>
                onFormChange({ ...form, priority: value })
              }
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date *</Label>
            <Input
              id="dueDate"
              type="date"
              value={form.dueDate}
              onChange={(e) =>
                onFormChange({ ...form, dueDate: e.target.value })
              }
              disabled={isLoading}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes"
              value={form.notes}
              onChange={(e) =>
                onFormChange({ ...form, notes: e.target.value })
              }
              disabled={isLoading}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !canSubmit}>
            {isLoading ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
