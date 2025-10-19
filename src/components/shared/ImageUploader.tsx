import { useState, useCallback, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  maxImages?: number;  // Default: 5
  maxSizeMB?: number;  // Default: 5
  images: string[];
  onImagesChange: (images: string[]) => void;
  disabled?: boolean;
  variant?: "default" | "compact";
}

/**
 * Shared Image Uploader Component
 * DRY: Used across Products, Campaigns, Disputes, Returns, Help Center
 * Features: Drag-drop, preview, reorder, Cloudinary upload (placeholder for now)
 * 
 * Swiggy/Zomato pattern: Simple drag-drop with instant previews
 */
export const ImageUploader = ({
  maxImages = 5,
  maxSizeMB = 5,
  images,
  onImagesChange,
  disabled = false,
  variant = "default",
}: ImageUploaderProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Check max images limit
    if (images.length + files.length > maxImages) {
      toast({
        title: "Too many images",
        description: `Maximum ${maxImages} images allowed`,
        variant: "destructive",
      });
      return;
    }

    // Validate file types and sizes
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image`,
          variant: "destructive",
        });
        continue;
      }

      // Check file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds ${maxSizeMB}MB`,
          variant: "destructive",
        });
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // TODO: Replace with Cloudinary upload in Phase 2
      // For now, convert to base64 data URLs for preview
      const uploadedUrls: string[] = [];

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        
        // Simulate upload progress
        setUploadProgress(Math.round(((i + 1) / validFiles.length) * 100));

        // Convert to data URL for preview (temporary until Cloudinary)
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });

        uploadedUrls.push(dataUrl);
      }

      onImagesChange([...images, ...uploadedUrls]);
      
      toast({
        title: "Images uploaded",
        description: `${validFiles.length} image(s) added successfully`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload images",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [images, maxImages, maxSizeMB, onImagesChange, toast]);

  // Drag & drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;
    
    handleFiles(e.dataTransfer.files);
  }, [disabled, handleFiles]);

  // Remove image
  const handleRemove = useCallback((index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onImagesChange(updated);
    
    toast({
      title: "Image removed",
      variant: "default",
    });
  }, [images, onImagesChange, toast]);

  // Reorder images (drag within preview)
  const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
    const updated = [...images];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    onImagesChange(updated);
  }, [images, onImagesChange]);

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg transition-colors",
          dragActive && !disabled ? "border-primary bg-primary/5" : "border-gray-300",
          disabled && "opacity-50 cursor-not-allowed",
          variant === "compact" ? "p-4" : "p-8"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <Upload className="w-6 h-6 text-gray-500" />
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-700">
              {variant === "compact" ? "Upload images" : "Drag & drop images or click to upload"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Max {maxImages} images, {maxSizeMB}MB each, JPG/PNG
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size={variant === "compact" ? "sm" : "default"}
            disabled={disabled || uploading || images.length >= maxImages}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Select Images
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            disabled={disabled}
            aria-label="Upload product images"
          />
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Uploading...</span>
              <span className="text-gray-900 font-medium">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}
      </div>

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {images.map((url, index) => (
            <Card key={index} className="relative group overflow-hidden">
              <div className="aspect-square relative">
                <img
                  src={url}
                  alt={`Product image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Remove button */}
                {!disabled && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemove(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}

                {/* Image number badge */}
                <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                  {index + 1}/{images.length}
                </div>
              </div>
            </Card>
          ))}

          {/* Add More Button (if under limit) */}
          {images.length < maxImages && !disabled && (
            <Card
              className="aspect-square flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors border-2 border-dashed"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-center p-4">
                <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500">
                  Add More<br />
                  ({maxImages - images.length} left)
                </p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Help Text */}
      {images.length === 0 && !uploading && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-700">
            <p className="font-medium">Tip: Use high-quality images</p>
            <p className="mt-1">First image will be the main product image. Reuse images from Amazon/manufacturer websites to save time (Swiggy/Zomato pattern).</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Import for ProductForm and other components
import { Plus } from "lucide-react";

