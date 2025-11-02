import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Upload, X, Image as ImageIcon, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/integrations/supabase-client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Personalization {
  id: string;
  label: string;
  requiresPreview: boolean;
}

interface FileUploadSheetProps {
  isOpen: boolean;
  onClose: () => void;
  orderItemId: string;
  personalizations: Personalization[];
  onUploadComplete?: () => void;
}

interface UploadedFile {
  personalizationId: string;
  personalizationName: string;
  file: File;
  preview?: string;
  uploadedUrl?: string;
  uploading: boolean;
  error?: string;
}

export const FileUploadSheet = ({ 
  isOpen, 
  onClose, 
  orderItemId, 
  personalizations,
  onUploadComplete 
}: FileUploadSheetProps) => {
  const { user } = useAuth();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [instructions, setInstructions] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Filter personalizations that require preview
  const previewRequiredPersonalizations = personalizations.filter(p => p.requiresPreview);

  // Initialize uploaded files state
  useEffect(() => {
    if (isOpen && previewRequiredPersonalizations.length > 0) {
      setUploadedFiles(
        previewRequiredPersonalizations.map(p => ({
          personalizationId: p.id,
          personalizationName: p.label,
          file: null as any,
          uploading: false,
        }))
      );
    }
  }, [isOpen, previewRequiredPersonalizations]);

  const handleFileChange = (personalizationId: string, file: File | null) => {
    if (!file) {
      setUploadedFiles(prev => prev.filter(f => f.personalizationId !== personalizationId));
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setUploadedFiles(prev => prev.map(f => 
        f.personalizationId === personalizationId 
          ? { ...f, error: 'Invalid file type. Please upload images or PDFs.' }
          : f
      ));
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadedFiles(prev => prev.map(f => 
        f.personalizationId === personalizationId 
          ? { ...f, error: 'File too large. Maximum size is 10MB.' }
          : f
      ));
      return;
    }

    // Create preview for images
    let preview: string | undefined;
    if (file.type.startsWith('image/')) {
      preview = URL.createObjectURL(file);
    }

    setUploadedFiles(prev => prev.map(f => 
      f.personalizationId === personalizationId 
        ? { ...f, file, preview, error: undefined }
        : f
    ));
  };

  const handleSubmit = async () => {
    // Validate all files uploaded
    if (uploadedFiles.some(f => !f.file)) {
      setError("Please upload all required design files.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Upload files to Supabase Storage
      const fileUrls: any[] = [];

      for (const uploadedFile of uploadedFiles) {
        if (!uploadedFile.file) continue;

        // Create unique file path
        const fileExt = uploadedFile.file.name.split('.').pop();
        const fileName = `${orderItemId}/${uploadedFile.personalizationId}-${Date.now()}.${fileExt}`;
        const filePath = `design-files/${fileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('design-files')
          .upload(filePath, uploadedFile.file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('design-files')
          .getPublicUrl(filePath);

        fileUrls.push({
          personalization_id: uploadedFile.personalizationId,
          name: uploadedFile.personalizationName,
          url: urlData.publicUrl,
          file_name: uploadedFile.file.name,
          uploaded_at: new Date().toISOString()
        });
      }

      // Call Edge Function to process files
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'process-design-files',
        {
          body: {
            orderItemId,
            fileUrls,
            instructions: instructions.trim() || null
          }
        }
      );

      if (functionError) throw functionError;

      setSuccess(true);
      
      // Call callback after delay
      setTimeout(() => {
        onUploadComplete?.();
        onClose();
      }, 1500);

    } catch (err: any) {
      console.error('Error uploading files:', err);
      setError(err.message || 'Failed to upload files. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (success || !isSubmitting) {
      setUploadedFiles([]);
      setInstructions("");
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  // Check if all files uploaded
  const allFilesUploaded = uploadedFiles.length > 0 && uploadedFiles.every(f => f.file);

  return (
    <Sheet open={isOpen} onOpenChange={handleClose} modal={false}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-xl sm:max-w-[640px] sm:left-1/2 sm:-translate-x-1/2 overflow-y-auto">
        {/* Grabber */}
        <div className="flex justify-center pt-2 pb-4">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        <SheetHeader className="text-left pb-4">
          <SheetTitle>Upload Design Files</SheetTitle>
          <p className="text-sm text-muted-foreground">
            Upload your design files for production. Our vendor will create a preview for your approval.
          </p>
        </SheetHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <div className="text-center">
              <h3 className="text-lg font-semibold">Files Uploaded Successfully!</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Your design files have been received. We'll create a preview and notify you once it's ready.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* File Upload Fields */}
            {uploadedFiles.map((uploadedFile, index) => (
              <div key={uploadedFile.personalizationId} className="space-y-2">
                <Label className="text-sm font-medium">
                  Upload {uploadedFile.personalizationName} {uploadedFile.file && <span className="text-green-600">✓</span>}
                </Label>
                
                {uploadedFile.error && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {uploadedFile.error}
                    </AlertDescription>
                  </Alert>
                )}

                {uploadedFile.preview ? (
                  <div className="relative border-2 border-green-200 rounded-lg p-3 bg-green-50 dark:bg-green-950">
                    <div className="flex items-center gap-3">
                      <img 
                        src={uploadedFile.preview} 
                        alt={uploadedFile.personalizationName}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-green-900 dark:text-green-100 truncate">
                          {uploadedFile.file?.name}
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300">
                          {(uploadedFile.file?.size || 0) / 1024 / 1024} MB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                        onClick={() => handleFileChange(uploadedFile.personalizationId, null)}
                        disabled={isSubmitting}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Images or PDF (MAX. 10MB)
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        handleFileChange(uploadedFile.personalizationId, file);
                      }}
                      disabled={isSubmitting}
                    />
                  </label>
                )}
              </div>
            ))}

            {/* Instructions Textarea */}
            <div className="space-y-2">
              <Label htmlFor="instructions" className="text-sm font-medium">
                Additional Instructions (Optional)
              </Label>
              <Textarea
                id="instructions"
                placeholder="Add any specific requirements or notes for the vendor..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={4}
                className="resize-none"
                disabled={isSubmitting}
              />
            </div>

            {/* Submit Button */}
            <div className="sticky bottom-0 bg-background pt-4 pb-4 border-t border-border">
              <Button
                className="w-full h-12"
                onClick={handleSubmit}
                disabled={!allFilesUploaded || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Submit Files
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">
                2 free changes included. Additional changes will be charged.
              </p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

