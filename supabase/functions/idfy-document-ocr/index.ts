/**
 * IDfy Document OCR Edge Function
 * Extracts data from PAN, GST, Cancelled Cheque, FSSAI documents
 * 
 * Production Credentials:
 * - Account ID: 1a3dfae3d9a0/20fba821-ee50-46db-9e7e-6c1716da6cbb
 * - API Key: a7cccddc-cd3c-4431-bd21-2d3f7694b955
 * 
 * Document-First Flow (Swiggy 2025 Pattern):
 * 1. User uploads document image/PDF
 * 2. This function extracts data using IDfy OCR
 * 3. Returns structured data for auto-fill
 * 4. Frontend auto-verifies extracted numbers
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type DocumentType = 'pan' | 'gst' | 'cancelled_cheque' | 'fssai' | 'msme'

interface DocumentOCRRequest {
  document_type: DocumentType
  file_base64?: string // Base64 encoded image/PDF
  file_url?: string // Supabase Storage URL
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { document_type, file_base64, file_url }: DocumentOCRRequest = await req.json()

    // Validate input
    if (!document_type || (!file_base64 && !file_url)) {
      return new Response(
        JSON.stringify({ error: 'Document type and file (base64 or URL) required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get file content
    let fileContent: string
    if (file_url) {
      // Download from Supabase Storage
      const filePath = file_url.replace(/^.*\/storage\/v1\/object\/public\//, '')
      const { data, error } = await supabaseClient.storage
        .from('partner-documents')
        .download(filePath)
      
      if (error || !data) {
        throw new Error('Failed to download file from storage')
      }
      
      const arrayBuffer = await data.arrayBuffer()
      fileContent = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
    } else {
      fileContent = file_base64!
    }

    // IDfy credentials
    const idfyAccountId = Deno.env.get('IDFY_ACCOUNT_ID') || '1a3dfae3d9a0/20fba821-ee50-46db-9e7e-6c1716da6cbb'
    const idfyApiKey = Deno.env.get('IDFY_API_KEY') || 'a7cccddc-cd3c-4431-bd21-2d3f7694b955'

    // Map document type to IDfy task
    const taskMap: Record<DocumentType, string> = {
      pan: 'ind_pan',
      gst: 'ind_gst_certificate',
      cancelled_cheque: 'ind_bank_statement',
      fssai: 'ind_fssai_certificate',
      msme: 'ind_udyam_certificate'
    }

    const taskId = taskMap[document_type]
    if (!taskId) {
      return new Response(
        JSON.stringify({ error: `Unsupported document type: ${document_type}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Call IDfy Document OCR API
    // Note: IDfy's OCR endpoints vary, using generic document extraction pattern
    const idfyResponse = await fetch(`https://eve.idfy.com/v3/tasks/async/${taskId}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'account-id': idfyAccountId,
        'api-key': idfyApiKey,
      },
      body: JSON.stringify({
        task_id: `${document_type}_${Date.now()}`,
        group_id: 'partner_kyc_ocr',
        data: {
          image: fileContent, // Base64 encoded image
        },
      }),
    })

    if (!idfyResponse.ok) {
      const errorText = await idfyResponse.text().catch(() => 'Unknown error')
      console.error('IDfy OCR error:', errorText)
      
      // Swiggy 2025: Silent error handling
      return new Response(
        JSON.stringify({
          success: false,
          extracted_data: null,
          error: 'Document extraction temporarily unavailable. Please enter details manually.',
          raw_error: errorText
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const idfyData = await idfyResponse.json()
    const sourceOutput = idfyData?.result?.source_output || {}

    // Extract structured data based on document type
    let extractedData: any = {}

    switch (document_type) {
      case 'pan':
        extractedData = {
          pan_number: sourceOutput.pan_number || sourceOutput.id_number || null,
          name: sourceOutput.name_on_card || sourceOutput.name || null,
          father_name: sourceOutput.father_name || null,
          dob: sourceOutput.date_of_birth || null,
        }
        break

      case 'gst':
        extractedData = {
          gst_number: sourceOutput.gstin || sourceOutput.gst_number || null,
          business_name: sourceOutput.legal_name || sourceOutput.business_name || null,
          trade_name: sourceOutput.trade_name || null,
          address: sourceOutput.principal_place_of_business_address || sourceOutput.address || null,
          registration_date: sourceOutput.registration_date || null,
        }
        break

      case 'cancelled_cheque':
        extractedData = {
          bank_account_number: sourceOutput.account_number || null,
          bank_ifsc: sourceOutput.ifsc_code || sourceOutput.ifsc || null,
          bank_name: sourceOutput.bank_name || null,
          account_holder_name: sourceOutput.account_holder_name || sourceOutput.name_at_bank || null,
          branch: sourceOutput.branch || null,
        }
        break

      case 'fssai':
        extractedData = {
          fssai_number: sourceOutput.license_number || sourceOutput.fssai_number || null,
          business_name: sourceOutput.business_name || null,
          address: sourceOutput.address || null,
          license_type: sourceOutput.license_type || null,
        }
        break

      case 'msme':
        extractedData = {
          udyam_number: sourceOutput.udyam_number || null,
          business_name: sourceOutput.business_name || null,
          enterprise_type: sourceOutput.enterprise_type || null,
          address: sourceOutput.address || null,
        }
        break
    }

    return new Response(
      JSON.stringify({
        success: true,
        extracted_data: extractedData,
        raw_response: idfyData,
        document_type,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    // Swiggy 2025: Silent error handling
    console.error('Document OCR error:', error.message || error)
    return new Response(
      JSON.stringify({
        success: false,
        extracted_data: null,
        error: 'Document extraction failed. Please enter details manually.',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})


