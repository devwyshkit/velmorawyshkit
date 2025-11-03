/**
 * Document Upload Zone Component (Swiggy 2025 Pattern)
 * Large, prominent upload area for document-first onboarding
 * Used in Step2KYC for PAN, GST, Cancelled Cheque, FSSAI uploads
 */

import { useState } from "react"
import { Upload, FileText, X, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type DocumentType = 'pan' | 'gst' | 'cancelled_cheque' | 'fssai' | 'msme'

interface DocumentUploadZoneProps {
  documentType: DocumentType
  label: string
  description?: string
  acceptedFormats?: string[]
  maxSizeMB?: number
  onUploadComplete: (file: File, fileUrl: string) => void
  extractedData?: any
  isProcessing?: boolean
  error?: string | null
  className?: string
}

export const DocumentUploadZone = ({
  documentType,
  label,
  description,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
  maxSizeMB = 5,
  onUploadComplete,
  onExtractionComplete,
  extractedData,
  isProcessing = false,
  error,
  className,
}: DocumentUploadZoneProps) => {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [fileUrl, setFileUrl] = useState<string | null>(null)

  const handleFileSelect = async (file: File) => {
    // Validate file
    if (!acceptedFormats.includes(file.type)) {
      alert(`Please upload ${acceptedFormats.map(f => f.split('/')[1]).join(', ')} files only`)
      return
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`File size must be less than ${maxSizeMB}MB`)
      return
    }

    setUploadedFile(file)

    // Upload to Supabase Storage
    try {
      // Generate preview URL
      const previewUrl = URL.createObjectURL(file)
      setFileUrl(previewUrl)

      // In production, upload to Supabase Storage here
      // const { data, error } = await supabase.storage
      //   .from('partner-documents')
      //   .upload(`${documentType}/${Date.now()}_${file.name}`, file)

      // For now, use local URL and call OCR
      const fileUrl = previewUrl
      onUploadComplete(file, fileUrl)

      // Trigger OCR extraction (handled by parent component)
    } catch (err) {
      console.error('File upload error:', err)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleRemove = () => {
    setUploadedFile(null)
    setFileUrl(null)
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl)
    }
  }

  const hasFile = uploadedFile !== null
  const hasData = extractedData && Object.keys(extractedData).length > 0

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <label className="text-sm font-medium">{label}</label>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center",
          isDragging
            ? "border-primary bg-primary/5"
            : hasFile
            ? "border-green-500 bg-green-50"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          error && "border-destructive"
        )}
      >
        {!hasFile ? (
          <>
            <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium mb-1">Drop document here or click to browse</p>
            <p className="text-xs text-muted-foreground mb-4">
              {acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')} up to {maxSizeMB}MB
            </p>
            <input
              type="file"
              accept={acceptedFormats.join(',')}
              onChange={handleFileInput}
              className="hidden"
              id={`upload-${documentType}`}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById(`upload-${documentType}`)?.click()}
            >
              Select File
            </Button>
          </>
        ) : (
          <div className="space-y-3">
            {/* File Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <FileText className="h-8 w-8 text-primary" />
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{uploadedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Processing State */}
            {isProcessing && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span>Extracting data from document...</span>
              </div>
            )}

            {/* Extracted Data Badge */}
            {hasData && !isProcessing && (
              <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>Data extracted successfully</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="flex items-center justify-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Extracted Data Preview (if available) */}
      {hasData && extractedData && (
        <div className="p-3 bg-muted rounded-lg text-xs space-y-1">
          <p className="font-medium mb-2">Extracted from document:</p>
          {Object.entries(extractedData).map(([key, value]) => (
            value && (
              <div key={key} className="flex justify-between">
                <span className="text-muted-foreground capitalize">
                  {key.replace(/_/g, ' ')}:
                </span>
                <span className="font-medium">{String(value)}</span>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  )
}

