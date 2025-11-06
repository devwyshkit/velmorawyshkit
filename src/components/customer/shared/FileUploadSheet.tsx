import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Upload, X, Image as ImageIcon, CheckCircle, AlertCircle, Loader2, Type, FileText, Layers, Palette } from "lucide-react";
// Phase 1 Cleanup: Removed Supabase imports - pure mock mode
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { updateOrderItemFiles, generatePreview } from "@/lib/mock-orders";

interface Personalization {
  id: string;
  label: string;
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
  // Swiggy 2025: Upload tracking states
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'complete'>('idle');
  // Swiggy 2025: Store timer IDs in refs for proper cleanup
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const processingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // All personalizations require preview (simplified rule - no conditional)
  const previewRequiredPersonalizations = personalizations;

  // Initialize uploaded files state
  useEffect(() => {
    if (isOpen && previewRequiredPersonalizations.length > 0) {
      setUploadedFiles(
        previewRequiredPersonalizations.map(p => ({
          personalizationId: p.id,
          personalizationName: p.label,
          file: null as File | null,
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
    setUploadStatus('uploading');
    setUploadProgress(0);

    try {
      // Swiggy 2025: Simulate upload progress (0-100%)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Phase 1 Cleanup: Always use mock upload - no conditionals
      // Create mock file URLs (using object URLs as placeholders)
      const fileUrls: string[] = uploadedFiles
        .filter(f => f.file)
        .map(f => {
          // Use object URL as mock file URL
          return f.preview || URL.createObjectURL(f.file!);
        });

      // Update order item with customization files
      updateOrderItemFiles(orderItemId, fileUrls);

      // Swiggy 2025: Complete upload progress
      clearInterval(progressInterval);
      setUploadProgress(100);
      await new Promise(resolve => setTimeout(resolve, 300));

      // Swiggy 2025: Show processing status
      setUploadStatus('processing');
      setUploadProgress(0);

      // Simulate vendor processing delay (2 seconds) with progress
      const processingInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(processingInterval);
            return 90;
          }
          return prev + 15;
        });
      }, 300);

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Swiggy 2025: Complete processing
      clearInterval(processingInterval);
      setUploadProgress(100);
      await new Promise(resolve => setTimeout(resolve, 300));

      // Generate mock preview after upload (simulate vendor creating preview)
      generatePreview(orderItemId);

      // Swiggy 2025: Show completion status
      setUploadStatus('complete');
      setSuccess(true);
      
      // Call callback after delay
      setTimeout(() => {
        onUploadComplete?.();
        onClose();
      }, 1500);

    } catch (err: unknown) {
      // Silent error handling - show inline error in upload UI (Swiggy 2025 pattern)
      setError(err instanceof Error ? err.message : 'Failed to upload files. Please try again.');
      setUploadStatus('idle');
      setUploadProgress(0);
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
      setUploadStatus('idle');
      setUploadProgress(0);
      onClose();
    }
  };

  // Check if all files uploaded
  const allFilesUploaded = uploadedFiles.length > 0 && uploadedFiles.every(f => f.file);

  // Phase 1: Helper functions for file type detection and labeling
  const getFileTypeIcon = (label: string) => {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('front')) return <Type className="h-5 w-5 text-primary" />;
    if (lowerLabel.includes('back')) return <Type className="h-5 w-5 text-primary rotate-180" />;
    if (lowerLabel.includes('logo')) return <Palette className="h-5 w-5 text-primary" />;
    if (lowerLabel.includes('design')) return <Layers className="h-5 w-5 text-primary" />;
    if (lowerLabel.includes('text')) return <Type className="h-5 w-5 text-primary" />;
    return <ImageIcon className="h-5 w-5 text-primary" />;
  };

  const getFileTypeDescription = (label: string) => {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('front')) {
      return "This design will be printed on the front side of your item";
    }
    if (lowerLabel.includes('back')) {
      return "This design will be printed on the back side of your item";
    }
    if (lowerLabel.includes('logo')) {
      return "Upload your logo file (PNG, SVG, or high-resolution image)";
    }
    if (lowerLabel.includes('design')) {
      return "Upload your custom design file for printing";
    }
    if (lowerLabel.includes('text')) {
      return "Upload text/typography design for customization";
    }
    return "Upload your design file for customization";
  };

  const getFileTypeLabel = (label: string) => {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('front')) {
      return "Front Print Design";
    }
    if (lowerLabel.includes('back')) {
      return "Back Print Design";
    }
    return label;
  };

  // Group related uploads (Front + Back Print together)
  const groupedUploads = uploadedFiles.reduce((acc, file) => {
    const label = file.personalizationName.toLowerCase();
    if (label.includes('front') || label.includes('back')) {
      const groupKey = 'print';
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(file);
    } else {
      const groupKey = file.personalizationId;
      acc[groupKey] = [file];
    }
    return acc;
  }, {} as Record<string, typeof uploadedFiles>);

  return (
    <Sheet open={isOpen} onOpenChange={handleClose} modal={false}>
      <SheetContent side="bottom" className="max-h-[75vh] rounded-t-xl sm:max-w-[640px] sm:left-1/2 sm:-translate-x-1/2 flex flex-col overflow-hidden">
        {/* Grabber - Outside scroll container (Swiggy 2025 pattern) */}
        <div className="flex justify-center pt-2 pb-4 flex-shrink-0">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Scrollable Content - Swiggy 2025 Pattern: Snap scrolling */}
        <div className="flex-1 overflow-y-auto snap-y snap-mandatory px-6">

        <SheetHeader className="text-left pb-4">
          <SheetTitle>Upload Design Files</SheetTitle>
          <p className="text-sm text-muted-foreground">
            Upload your design files for production. Our vendor will create a preview for your approval.
          </p>
        </SheetHeader>

        {/* Swiggy 2025: Upload Progress & Status Tracking */}
        {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {uploadStatus === 'uploading' ? 'Uploading files...' : 'Processing files...'}
              </span>
              <span className="text-muted-foreground">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {uploadStatus === 'uploading' 
                ? 'Please wait while we upload your files' 
                : 'Our vendor is processing your files. This may take a few moments.'}
            </p>
          </div>
        )}

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

            {/* File Upload Fields - Grouped by type (Phase 1: Enhanced labels) */}
            {Object.entries(groupedUploads).map(([groupKey, groupFiles]) => (
              <div key={groupKey} className="space-y-4">
                {/* Group Header for Print-related uploads */}
                {groupKey === 'print' && groupFiles.length > 1 && (
                  <div className="pb-2 border-b border-border">
                    <h4 className="text-sm font-semibold text-muted-foreground">Print Customization</h4>
                  </div>
                )}
                
                {groupFiles.map((uploadedFile) => (
                  <div key={uploadedFile.personalizationId} className="space-y-2">
                    <div className="flex items-start gap-2">
                      {getFileTypeIcon(uploadedFile.personalizationName)}
                      <div className="flex-1">
                        <Label className="text-sm font-semibold">
                          {getFileTypeLabel(uploadedFile.personalizationName)} *
                          {uploadedFile.file && <span className="text-green-600 ml-2">✓</span>}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          {getFileTypeDescription(uploadedFile.personalizationName)}
                        </p>
                      </div>
                    </div>
                
                {uploadedFile.error && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {uploadedFile.error}
                    </AlertDescription>
                  </Alert>
                )}

                {uploadedFile.preview ? (
                  <div className="relative border-2 border-green-200 rounded-lg p-3 bg-green-50">
                    <div className="flex items-center gap-3">
                      <img 
                        src={uploadedFile.preview} 
                        alt={uploadedFile.personalizationName}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-green-900 truncate">
                          {uploadedFile.file?.name}
                        </p>
                        <p className="text-xs text-green-700">
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
        </div>
      </SheetContent>
    </Sheet>
  );
};

