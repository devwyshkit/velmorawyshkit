import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle2, XCircle, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

export type DocumentType = "pan" | "gst" | "fssai" | "cancelled_cheque";

interface DocumentUploadZoneProps {
  documentType: DocumentType;
  label: string;
  description?: string;
  onUploadComplete: (file: File, fileUrl: string) => void;
  extractedData?: Record<string, any>;
  isProcessing?: boolean;
  error?: string | null;
  disabled?: boolean;
}

export const DocumentUploadZone = ({
  documentType,
  label,
  description,
  onUploadComplete,
  extractedData,
  isProcessing = false,
  error,
  disabled = false,
}: DocumentUploadZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return;
    }

    setUploadedFile(file);

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }

    // Upload to Supabase storage
    try {
      const { supabase } = await import("@/lib/integrations/supabase-client");
      const fileExt = file.name.split(".").pop();
      const fileName = `${documentType}_${Date.now()}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from("partner-documents")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("partner-documents")
        .getPublicUrl(filePath);

      onUploadComplete(file, urlData.publicUrl);
    } catch (err) {
      // Silent error handling - let parent handle it
      console.error("Upload error:", err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleClick = () => {
    if (!disabled && !isProcessing) {
      fileInputRef.current?.click();
    }
  };

  const hasFile = uploadedFile !== null || previewUrl !== null;
  const hasError = error !== null && error !== undefined;

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer",
          {
            "border-primary bg-primary/5": isDragging && !disabled,
            "border-muted-foreground/25": !isDragging && !hasFile && !hasError,
            "border-green-500/50 bg-green-500/5": hasFile && !hasError,
            "border-destructive/50 bg-destructive/5": hasError,
            "opacity-50 cursor-not-allowed": disabled || isProcessing,
          }
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={handleInputChange}
          disabled={disabled || isProcessing}
        />

        <div className="flex flex-col items-center justify-center space-y-3 text-center">
          {isProcessing ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Processing document...</p>
                <p className="text-xs text-muted-foreground">Extracting data from document</p>
              </div>
            </>
          ) : hasFile && !hasError ? (
            <>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  {uploadedFile?.name || "Document uploaded"}
                </p>
                {extractedData && (
                  <p className="text-xs text-muted-foreground">
                    Data extracted successfully
                  </p>
                )}
              </div>
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Document preview"
                  className="max-h-32 rounded border"
                />
              )}
            </>
          ) : hasError ? (
            <>
              <XCircle className="h-8 w-8 text-destructive" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">Upload failed</p>
                <p className="text-xs text-muted-foreground">{error}</p>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-full bg-primary/10 p-3">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">{label}</p>
                {description && (
                  <p className="text-xs text-muted-foreground">{description}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Click to upload or drag and drop
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {extractedData && Object.keys(extractedData).length > 0 && (
        <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-xs text-green-800 dark:text-green-200">
            Data extracted from document. Please verify the information below.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};




