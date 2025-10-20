import { useState, useRef } from "react";
import { Upload, Download, AlertCircle, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/integrations/supabase-client";
import { importFromCSV, downloadCSVTemplate, CSVImportResult } from "@/lib/products/csvUtils";
import { useAuth } from "@/contexts/AuthContext";

interface CSVImporterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CSVImporter = ({
  open,
  onOpenChange,
  onSuccess,
}: CSVImporterProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [validationResult, setValidationResult] = useState<CSVImportResult | null>(null);
  const [preview, setPreview] = useState<any[]>([]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setValidationResult(null);
    setPreview([]);

    // Validate CSV
    try {
      const result = await importFromCSV(selectedFile);
      setValidationResult(result);
      setPreview(result.data?.slice(0, 5) || []);
    } catch (error: any) {
      setValidationResult(error);
    }
  };

  const handleImport = async () => {
    if (!validationResult?.success || !validationResult.data || !user) return;

    setImporting(true);
    setProgress(0);

    try {
      const products = validationResult.data;
      const total = products.length;

      // Import in batches of 10
      const batchSize = 10;
      let imported = 0;

      for (let i = 0; i < total; i += batchSize) {
        const batch = products.slice(i, i + batchSize).map(p => ({
          ...p,
          partner_id: user.id,
        }));

        const { error } = await supabase
          .from('partner_products')
          .insert(batch);

        if (error) throw error;

        imported += batch.length;
        setProgress((imported / total) * 100);
      }

      toast({
        title: "Import successful",
        description: `Imported ${total} products successfully`,
      });

      onSuccess();
      onOpenChange(false);
      resetState();
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message || "Failed to import products",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      setProgress(0);
    }
  };

  const resetState = () => {
    setFile(null);
    setValidationResult(null);
    setPreview([]);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetState();
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Import Products from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import products
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Download */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium">Don't have a CSV file?</p>
              <p className="text-xs text-muted-foreground">Download our template to get started</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadCSVTemplate}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Template
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-3">
            <Label>Upload CSV File</Label>
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                aria-label="Upload CSV file"
              />
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium mb-1">
                {file ? file.name : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-muted-foreground">
                CSV file (required columns: name, price, stock)
              </p>
            </div>
          </div>

          {/* Validation Errors */}
          {validationResult && !validationResult.success && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Validation Failed</AlertTitle>
              <AlertDescription>
                <ScrollArea className="max-h-40 mt-2">
                  <ul className="text-xs space-y-1">
                    {validationResult.errors?.map((error, idx) => (
                      <li key={idx}>• {error}</li>
                    ))}
                  </ul>
                </ScrollArea>
              </AlertDescription>
            </Alert>
          )}

          {/* Validation Success + Preview */}
          {validationResult?.success && (
            <>
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle>Validation Successful</AlertTitle>
                <AlertDescription className="text-xs">
                  Ready to import {validationResult.rowCount} products
                </AlertDescription>
              </Alert>

              {preview.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Preview (first 5 rows)</p>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted">
                        <tr>
                          <th className="p-2 text-left">Name</th>
                          <th className="p-2 text-left">Price</th>
                          <th className="p-2 text-left">Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((row, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="p-2 truncate max-w-[150px]">{row.name}</td>
                            <td className="p-2">₹{(row.price / 100).toLocaleString('en-IN')}</td>
                            <td className="p-2">{row.stock}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {validationResult.rowCount! > 5 && (
                    <p className="text-xs text-muted-foreground text-center">
                      ...and {validationResult.rowCount! - 5} more rows
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {/* Import Progress */}
          {importing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Importing products...</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
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
            disabled={!validationResult?.success || importing}
          >
            {importing ? "Importing..." : `Import ${validationResult?.rowCount || 0} Products`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
