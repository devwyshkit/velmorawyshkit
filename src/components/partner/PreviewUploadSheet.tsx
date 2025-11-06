import { useState } from "react";
import { Upload, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { updateOrderItemPreview, generatePreview } from "@/lib/mock-orders";

interface PreviewUploadSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  orderItemId: string;
  onSuccess: () => void;
}

/**
 * PreviewUploadSheet - Swiggy 2025 Pattern
 * Partner upload preview for customer review
 * Converted from Dialog to Bottom Sheet (Swiggy 2025 pattern)
 */
export const PreviewUploadSheet = ({ 
  isOpen, 
  onOpenChange, 
  orderItemId,
  onSuccess 
}: PreviewUploadSheetProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const imageFiles = selectedFiles.filter(file => 
      file.type.startsWith('image/') || file.type === 'application/pdf'
    );

    if (imageFiles.length === 0) {
      toast({
        title: "Invalid file type",
        description: "Please select image files (JPG, PNG) or PDF",
        variant: "destructive",
      });
      return;
    }

    // Limit to 5 files
    const newFiles = [...files, ...imageFiles].slice(0, 5);
    setFiles(newFiles);

    // Generate preview URLs for images
    const newPreviewUrls: string[] = [];
    newFiles.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        newPreviewUrls.push(url);
      } else {
        newPreviewUrls.push('');
      }
    });
    setPreviewUrls(newPreviewUrls);
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviewUrls = previewUrls.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviewUrls(newPreviewUrls);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please upload at least one preview image",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      // Mock upload - create object URLs as preview URLs
      const uploadedUrls: string[] = previewUrls.filter(url => url !== '');

      // Update order item with preview (mock mode)
      // Set preview URLs and status to preview_ready
      updateOrderItemPreview(orderItemId, {
        preview_url: uploadedUrls.length > 0 ? uploadedUrls : [previewUrls[0] || ''],
        preview_status: 'preview_ready',
        preview_generated_at: new Date().toISOString(),
      });

      toast({
        title: "Preview uploaded",
        description: "Customer will be notified to review the preview",
      });

      // Reset form
      setFiles([]);
      setPreviewUrls([]);
      setNotes("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload preview. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange} modal={false}>
      <SheetContent 
        side="bottom" 
        className="h-[90vh] rounded-t-xl sm:max-w-[640px] sm:left-1/2 sm:-translate-x-1/2 overflow-y-auto"
      >
        {/* Grabber */}
        <div className="flex justify-center pt-2 pb-4">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        <SheetHeader className="text-left pb-4">
          <SheetTitle>Upload Preview</SheetTitle>
          <SheetDescription>
            Upload preview images for customer review. Customer will approve or request revision.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label>Preview Images/PDFs</Label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, or PDF (MAX. 5 files)
                </p>
              </div>
              <input
                type="file"
                id="preview-upload"
                accept="image/*,application/pdf"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>

          {/* Preview Files */}
          {files.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Files ({files.length}/5)</Label>
              <div className="grid grid-cols-2 gap-3">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="relative border rounded-lg p-2 group"
                  >
                    {previewUrls[index] ? (
                      <img
                        src={previewUrls[index]}
                        alt={file.name}
                        className="w-full h-32 object-cover rounded"
                      />
                    ) : (
                      <div className="w-full h-32 flex items-center justify-center bg-muted rounded">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={`Remove ${file.name}`}
                      disabled={uploading}
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {file.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="preview-notes">Notes (Optional)</Label>
            <Textarea
              id="preview-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this preview..."
              rows={3}
              disabled={uploading}
            />
          </div>

          {/* Actions */}
          <div className="sticky bottom-0 bg-background pt-4 pb-4 border-t border-border space-y-2">
            <Button
              onClick={handleUpload}
              className="w-full h-12"
              disabled={uploading || files.length === 0}
            >
              {uploading ? "Uploading..." : "Upload Preview"}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full"
              disabled={uploading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

