'use client'

export interface AttachmentChipsProps {
  files: File[]
  onRemove: (index: number) => void
}

export interface UseAttachmentChipsReturn {
  files: File[]
  onRemove: (index: number) => void
}

export const useAttachmentChips = ({ files, onRemove }: AttachmentChipsProps): UseAttachmentChipsReturn => ({
  files,
  onRemove,
})
