/**
 * CSV Import Component
 * Allows bulk product import from CSV file
 * Includes validation and preview
 */

import { useState, useRef } from "react";
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/integrations/supabase-client";
import { useAuth } from "@/contexts/AuthContext";
import { importProductsFromCSV, downloadCSVTemplate, CSVImportResult } from "@/lib/products/csvUtils";
import { cn } from "@/lib/utils";

interface CSVImporterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CSVImporterDialog = ({
  open,
  onOpenChange,
  onSuccess
}: CSVImporterProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<CSVImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast({
        title: "Invalid file",
        description: "Please select a CSV file",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    setLoading(true);

    try {
      const importResult = await importProductsFromCSV(selectedFile);
      setResult(importResult);

      if (!importResult.success) {
        toast({
          title: "Validation errors found",
          description: `Found ${importResult.errors?.length} error(s) in CSV`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "CSV validated",
          description: `Ready to import ${importResult.count} product(s)`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!result?.success || !result.data || !user) return;

    setImporting(true);
    try {
      // Add partner_id to each product
      const productsWithPartnerId = result.data.map(p => ({
        ...p,
        partner_id: user.id,
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('partner_products')
        .insert(productsWithPartnerId);

      if (error) throw error;

      toast({
        title: "Import successful",
        description: `Imported ${result.count} product(s)`,
      });

      onSuccess();
      onOpenChange(false);
      resetState();
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setResult(null);
    setLoading(false);
    setImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetState();
    }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Products from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import products
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Download */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadCSVTemplate}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Download Template
            </Button>
            <p className="text-sm text-muted-foreground">
              Download sample CSV format
            </p>
          </div>

          {/* File Upload */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              file ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              aria-label="Upload CSV file"
            />
            
            {loading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Validating CSV...</p>
              </div>
            ) : file ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">Click to change file</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="font-medium">Click to upload CSV</p>
                <p className="text-sm text-muted-foreground">or drag and drop</p>
              </div>
            )}
          </div>

          {/* Validation Results */}
          {result && !result.success && result.errors && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md max-h-48 overflow-y-auto">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <p className="text-sm font-medium text-destructive">
                  {result.errors.length} Validation Error(s)
                </p>
              </div>
              <ul className="text-sm space-y-1">
                {result.errors.map((err, idx) => (
                  <li key={idx} className="text-muted-foreground">
                    Row {err.row}: {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Success Preview */}
          {result && result.success && (
            <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  Ready to import {result.count} product(s)
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Preview: {result.data?.slice(0, 3).map(p => p.name).join(', ')}
                {(result.count || 0) > 3 && ` ...and ${(result.count || 0) - 3} more`}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={importing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!result?.success || importing}
          >
            {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import {result?.count || 0} Products
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

