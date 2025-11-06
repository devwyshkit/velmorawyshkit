/**
 * Onboarding Step 2: KYC Documents (Swiggy 2025 Document-First Pattern)
 * 
 * Flow:
 * 1. User uploads documents (PAN, GST, Cancelled Cheque, FSSAI)
 * 2. OCR automatically extracts data
 * 3. Form fields auto-fill from extracted data
 * 4. Verification happens automatically in background
 * 5. Inline status badges show verification state
 * 
 * NO manual entry as primary, NO verify buttons, NO toasts
 */

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ArrowRight, ArrowLeft, AlertTriangle, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";
import { DocumentUploadZone, type DocumentType } from "@/components/partner/onboarding/DocumentUploadZone";
import { useIdfyDocumentOCR } from "@/hooks/use-idfy-document-ocr";
import * as idfyReal from "@/lib/api/idfy-real";
import { useAuth } from "@/contexts/AuthContext";

// Conditional schema based on category
const createStep2Schema = (requiresFSSAI: boolean) => {
  const base = z.object({
    pan_number: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format"),
    gst_number: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[Z0-9]{1}[A-Z]{1}[0-9]{1}$/, "Invalid GST format"),
  });

  if (requiresFSSAI) {
    return base.extend({
      fssai_number: z.string().regex(/^[0-9]{14}$/, "Invalid FSSAI license (14 digits)"),
    });
  }

  return base;
};

interface Step2KYCProps {
  initialData: any;
  category?: string;
  onNext: (data: any) => void;
  onBack: () => void;
}

type VerificationStatus = 'pending' | 'verifying' | 'verified' | 'failed';

interface DocumentState {
  fileUrl: string | null;
  extractedData: any;
  status: VerificationStatus;
  verificationId: string | null;
  error: string | null;
}

export const Step2KYC = ({ initialData, category, onNext, onBack }: Step2KYCProps) => {
  const { user } = useAuth();
  const requiresFSSAI = ['food', 'perishables', 'beverages'].includes(category || '');
  
  const schema = createStep2Schema(requiresFSSAI);
  type Step2FormValues = z.infer<typeof schema>;

  const form = useForm<Step2FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      pan_number: initialData.pan_number || "",
      gst_number: initialData.gst_number || "",
      ...(requiresFSSAI && { fssai_number: initialData.fssai_number || "" }),
    } as any,
  });

  // Document states for each document type
  const [panDoc, setPanDoc] = useState<DocumentState>({
    fileUrl: initialData.pan_document_url || null,
    extractedData: null,
    status: 'pending',
    verificationId: null,
    error: null,
  });

  const [gstDoc, setGstDoc] = useState<DocumentState>({
    fileUrl: initialData.gst_document_url || null,
    extractedData: null,
    status: 'pending',
    verificationId: null,
    error: null,
  });

  const [fssaiDoc, setFssaiDoc] = useState<DocumentState>({
    fileUrl: initialData.fssai_document_url || null,
    extractedData: null,
    status: 'pending',
    verificationId: null,
    error: null,
  });

  const { processDocumentOCR, uploadAndProcess, isProcessing } = useIdfyDocumentOCR();

  // Auto-verify extracted numbers in background
  const autoVerifyExtractedNumber = async (
    type: 'pan' | 'gst' | 'fssai',
    number: string,
    setDocState: (updater: (prev: DocumentState) => DocumentState) => void
  ) => {
    if (!number) return;

    setDocState(prev => ({ ...prev, status: 'verifying' }));

    try {
      let verificationResult: any;

      if (type === 'pan') {
        verificationResult = await idfyReal.verifyPAN(number);
      } else if (type === 'gst') {
        verificationResult = await idfyReal.verifyGST(number);
      } else if (type === 'fssai') {
        verificationResult = await idfyReal.verifyFSSAI(number);
      }

      if (verificationResult.verified) {
        setDocState(prev => ({
          ...prev,
          status: 'verified',
          verificationId: verificationResult.verification_id,
          error: null,
        }));
      } else {
        setDocState(prev => ({
          ...prev,
          status: 'failed',
          error: 'Verification failed. Please check the number and try again.',
        }));
      }
    } catch (error: any) {
      setDocState(prev => ({
        ...prev,
        status: 'failed',
        error: 'Verification temporarily unavailable',
      }));
    }
  };

  // Handle document upload and OCR
  const handleDocumentUpload = async (
    type: DocumentType,
    file: File,
    fileUrl: string
  ) => {
    if (!user?.id) return;

    let setDocState: (updater: (prev: DocumentState) => DocumentState) => void;
    
    if (type === 'pan') {
      setDocState = setPanDoc;
    } else if (type === 'gst') {
      setDocState = setGstDoc;
    } else if (type === 'fssai') {
      setDocState = setFssaiDoc;
    } else {
      return;
    }

    setDocState(prev => ({ ...prev, fileUrl, error: null }));

    // Process OCR
    const result = await uploadAndProcess(type, file, user.id);

    if (result.ocrResult.success && result.ocrResult.extracted_data) {
      const extractedData = result.ocrResult.extracted_data;
      setDocState(prev => ({ ...prev, extractedData }));

      // Auto-fill form fields
      if (type === 'pan' && extractedData.pan_number) {
        form.setValue('pan_number', extractedData.pan_number.toUpperCase());
        // Auto-verify
        await autoVerifyExtractedNumber('pan', extractedData.pan_number, setDocState);
      } else if (type === 'gst' && extractedData.gst_number) {
        form.setValue('gst_number', extractedData.gst_number.toUpperCase());
        // Auto-verify
        await autoVerifyExtractedNumber('gst', extractedData.gst_number, setDocState);
      } else if (type === 'fssai' && extractedData.fssai_number) {
        form.setValue('fssai_number', extractedData.fssai_number);
        // Auto-verify
        await autoVerifyExtractedNumber('fssai', extractedData.fssai_number, setDocState);
      }
    } else {
      setDocState(prev => ({
        ...prev,
        error: result.ocrResult.error || 'Failed to extract data. Please enter details manually.',
      }));
    }
  };

  const onSubmit = (values: Step2FormValues) => {
    onNext({
      pan_number: values.pan_number,
      gst_number: values.gst_number,
      ...(requiresFSSAI && { fssai_number: (values as any).fssai_number }),
      pan_document_url: panDoc.fileUrl,
      gst_document_url: gstDoc.fileUrl,
      ...(requiresFSSAI && { fssai_document_url: fssaiDoc.fileUrl }),
      // Verification IDs
      pan_verification_id: panDoc.verificationId,
      gst_verification_id: gstDoc.verificationId,
      ...(requiresFSSAI && { fssai_verification_id: fssaiDoc.verificationId }),
      // Verification status
      pan_verified: panDoc.status === 'verified',
      gst_verified: gstDoc.status === 'verified',
      ...(requiresFSSAI && { fssai_verified: fssaiDoc.status === 'verified' }),
    });
  };

  const getVerificationBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'verified':
        return (
          <Badge variant="default" className="bg-green-600 text-xs gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Verified
          </Badge>
        );
      case 'verifying':
        return (
          <Badge variant="secondary" className="text-xs gap-1">
            <span>Uploading...</span>
            Verifying...
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="text-xs gap-1">
            <AlertCircle className="h-3 w-3" />
            Failed
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">KYC Documents</h2>
          <p className="text-sm text-muted-foreground">
            Upload your business documents. We'll extract and verify the details automatically.
          </p>
        </div>

        {/* Conditional FSSAI Alert */}
        {requiresFSSAI && (
          <Alert variant="default" className="border-primary">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>FSSAI License Required</AlertTitle>
            <AlertDescription className="text-xs space-y-2">
              <p>
                Since you deal with <strong>{category}</strong>, FSSAI license is mandatory.
              </p>
              <a
                href="https://foscos.fssai.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                How to get FSSAI license? <ExternalLink className="h-3 w-3" />
              </a>
            </AlertDescription>
          </Alert>
        )}

        {/* PAN Card Upload (Document-First) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">PAN Card</h3>
            {panDoc.status !== 'pending' && getVerificationBadge(panDoc.status)}
          </div>

          <DocumentUploadZone
            documentType="pan"
            label="Upload PAN Card"
            description="Upload a clear image of your PAN card"
            onUploadComplete={(file, fileUrl) => handleDocumentUpload('pan', file, fileUrl)}
            extractedData={panDoc.extractedData}
            isProcessing={isProcessing}
            error={panDoc.error}
          />

          {/* Manual Entry Fallback (Editable if OCR fails) */}
          <FormField
            control={form.control}
            name="pan_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PAN Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    className="uppercase"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  {panDoc.extractedData?.pan_number
                    ? "Extracted from document. You can edit if needed."
                    : "Enter manually if extraction didn't work"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* GST Certificate Upload (Document-First) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">GST Registration</h3>
            {gstDoc.status !== 'pending' && getVerificationBadge(gstDoc.status)}
          </div>

          <DocumentUploadZone
            documentType="gst"
            label="Upload GST Certificate"
            description="Upload a clear image of your GST registration certificate"
            onUploadComplete={(file, fileUrl) => handleDocumentUpload('gst', file, fileUrl)}
            extractedData={gstDoc.extractedData}
            isProcessing={isProcessing}
            error={gstDoc.error}
          />

          {/* Manual Entry Fallback */}
          <FormField
            control={form.control}
            name="gst_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GST Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="22AAAAA0000A1Z5"
                    maxLength={15}
                    className="uppercase"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  {gstDoc.extractedData?.gst_number
                    ? "Extracted from document. You can edit if needed."
                    : "Enter manually if extraction didn't work"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* FSSAI License Upload (Conditional, Document-First) */}
        {requiresFSSAI && (
          <div className="space-y-3 p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-primary" />
                FSSAI License (Required for Food)
              </h3>
              {fssaiDoc.status !== 'pending' && getVerificationBadge(fssaiDoc.status)}
            </div>

            <DocumentUploadZone
              documentType="fssai"
              label="Upload FSSAI Certificate"
              description="Upload a clear image of your FSSAI license certificate"
              onUploadComplete={(file, fileUrl) => handleDocumentUpload('fssai', file, fileUrl)}
              extractedData={fssaiDoc.extractedData}
              isProcessing={isProcessing}
              error={fssaiDoc.error}
            />

            {/* Manual Entry Fallback */}
            <FormField
              control={form.control}
              name="fssai_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>FSSAI License Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="12345678901234"
                      maxLength={14}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    {fssaiDoc.extractedData?.fssai_number
                      ? "Extracted from document. You can edit if needed."
                      : "Enter manually if extraction didn't work"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Error Messages (Inline, no toasts) */}
        {(panDoc.error || gstDoc.error || (requiresFSSAI && fssaiDoc.error)) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Document Processing Issues</AlertTitle>
            <AlertDescription>
              {panDoc.error && <p className="text-xs">PAN: {panDoc.error}</p>}
              {gstDoc.error && <p className="text-xs">GST: {gstDoc.error}</p>}
              {requiresFSSAI && fssaiDoc.error && <p className="text-xs">FSSAI: {fssaiDoc.error}</p>}
              <p className="text-xs mt-2">You can enter details manually and continue.</p>
            </AlertDescription>
          </Alert>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button type="button" variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button type="submit" className="gap-2">
            Next: Banking Details
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </Form>
  );
};
