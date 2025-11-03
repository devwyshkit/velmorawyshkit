/**
 * Hook for IDfy Document OCR Processing
 * Handles document upload, OCR extraction, and auto-verification
 * Following Swiggy 2025 document-first pattern
 */

import { useState } from "react"
import { supabase } from "@/lib/integrations/supabase-client"
import type { DocumentType } from "@/components/partner/onboarding/DocumentUploadZone"

interface OCRResult {
  success: boolean
  extracted_data: any
  error?: string
  raw_response?: any
}

export const useIdfyDocumentOCR = () => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Process document OCR through Edge Function
   */
  const processDocumentOCR = async (
    documentType: DocumentType,
    file: File
  ): Promise<OCRResult> => {
    setIsProcessing(true)
    setError(null)

    try {
      // Convert file to base64
      const base64 = await fileToBase64(file)

      // Call Edge Function
      const { data, error: functionError } = await supabase.functions.invoke('idfy-document-ocr', {
        body: {
          document_type: documentType,
          file_base64: base64,
        },
      })

      if (functionError) {
        throw new Error(functionError.message || 'OCR processing failed')
      }

      if (!data.success) {
        setError(data.error || 'Failed to extract data from document')
        return {
          success: false,
          extracted_data: null,
          error: data.error,
        }
      }

      return {
        success: true,
        extracted_data: data.extracted_data,
        raw_response: data.raw_response,
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Document extraction failed'
      setError(errorMessage)
      return {
        success: false,
        extracted_data: null,
        error: errorMessage,
      }
    } finally {
      setIsProcessing(false)
    }
  }

  /**
   * Upload document to Supabase Storage and process OCR
   */
  const uploadAndProcess = async (
    documentType: DocumentType,
    file: File,
    userId: string
  ): Promise<{ fileUrl: string; ocrResult: OCRResult }> => {
    setIsProcessing(true)
    setError(null)

    try {
      // Upload to Supabase Storage
      const fileName = `${documentType}/${userId}/${Date.now()}_${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('partner-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        throw new Error(uploadError.message || 'File upload failed')
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('partner-documents')
        .getPublicUrl(fileName)

      const fileUrl = urlData.publicUrl

      // Process OCR
      const ocrResult = await processDocumentOCR(documentType, file)

      return {
        fileUrl,
        ocrResult,
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Upload and processing failed'
      setError(errorMessage)
      return {
        fileUrl: '',
        ocrResult: {
          success: false,
          extracted_data: null,
          error: errorMessage,
        },
      }
    } finally {
      setIsProcessing(false)
    }
  }

  return {
    processDocumentOCR,
    uploadAndProcess,
    isProcessing,
    error,
  }
}

/**
 * Convert File to Base64
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1] // Remove data:image/...;base64, prefix
      resolve(base64String)
    }
    reader.onerror = (error) => reject(error)
  })
}


