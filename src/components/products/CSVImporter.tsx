/**
 * CSV Importer
 * Feature 2: PROMPT 8
 * Import products from CSV file
 */

import { useState, useRef } from "react";
import { Upload, Download, CheckCircle2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/integrations/supabase-client";
import { 
  parseProductsCSV, 
  downloadCSVTemplate,
  type CSVParseResult 
} from "@/lib/products/csvUtils";

interface CSVImporterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CSVImporter = ({
  open,
  onOpenChange,
  onSuccess
}: CSVImporterProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    
    try {
      const result = await parseProductsCSV(selectedFile);
      setParseResult(result);
      
      if (!result.valid) {
        toast({
          title: "Validation errors",
          description: `Found ${result.errors.length} error${result.errors.length !== 1 ? 's' : ''} in CSV file`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Parse error",
        description: error.message,
        variant: "destructive",
      });
      setFile(null);
      setParseResult(null);
    }
  };

  const handleImport = async () => {
    if (!user || !parseResult || !parseResult.valid) return;

    setImporting(true);
    setProgress(0);

    try {
      const total = parseResult.data.length;
      let imported = 0;

      // Import products in batches of 10
      const batchSize = 10;
      for (let i = 0; i < total; i += batchSize) {
        const batch = parseResult.data.slice(i, i + batchSize);
        
        const productsToInsert = batch.map(row => ({
          partner_id: user.id,
          name: row.name,
          sku: row.sku || null,
          description: row.description || '',
          price: Math.round(row.price * 100), // Convert to paise
          wholesale_price: row.wholesale_price ? Math.round(row.wholesale_price * 100) : null,
          stock: row.stock,
          category: row.category || null,
          tags: row.tags ? row.tags.split(',').map(t => t.trim()) : [],
          is_active: row.is_active !== false,
          images: [],
          is_customizable: false,
          add_ons: [],
        }));

        const { error } = await supabase
          .from('partner_products')
          .insert(productsToInsert);

        if (error) throw error;

        imported += batch.length;
        setProgress((imported / total) * 100);
      }

      toast({
        title: "Import successful",
        description: `Imported ${imported} product${imported !== 1 ? 's' : ''} successfully.`,
      });

      onSuccess();
      handleReset();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      setProgress(0);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParseResult(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Products from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import products
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Download Template */}
          <div className="flex items-center justify-between p-4 border rounded-md">
            <div>
              <p className="font-medium">Need a template?</p>
              <p className="text-sm text-muted-foreground">
                Download sample CSV with required columns
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadCSVTemplate}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="Upload CSV file"
            />
            
            <Button
              variant="outline"
              className="w-full h-32 border-dashed"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
            >
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium">
                    {file ? file.name : 'Click to upload CSV'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {file ? 'Click to select a different file' : 'Or drag and drop your file here'}
                  </p>
                </div>
              </div>
            </Button>
          </div>

          {/* Validation Results */}
          {parseResult && (
            <div className="space-y-2">
              {parseResult.valid ? (
                <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-md">
                  <CheckCircle2 className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Ready to import</p>
                    <p className="text-sm">
                      {parseResult.data.length} product{parseResult.data.length !== 1 ? 's' : ''} found
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md">
                    <AlertCircle className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Validation errors found</p>
                      <p className="text-sm">
                        {parseResult.errors.length} error{parseResult.errors.length !== 1 ? 's' : ''} must be fixed before importing
                      </p>
                    </div>
                  </div>
                  
                  <ScrollArea className="h-48 rounded-md border p-3">
                    <div className="space-y-2">
                      {parseResult.errors.map((error, idx) => (
                        <div key={idx} className="text-sm">
                          <span className="font-medium">Row {error.row}</span>
                          {' - '}
                          <span className="text-muted-foreground">{error.field}:</span>
                          {' '}
                          <span className="text-red-600">{error.message}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}

          {/* Import Progress */}
          {importing && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">
                Importing products... {Math.round(progress)}%
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                handleReset();
                onOpenChange(false);
              }}
              disabled={importing}
            >
              Cancel
            </Button>
            {file && parseResult && (
              <Button
                onClick={handleImport}
                disabled={!parseResult.valid || importing}
              >
                {importing ? 'Importing...' : `Import ${parseResult.data.length} Products`}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

