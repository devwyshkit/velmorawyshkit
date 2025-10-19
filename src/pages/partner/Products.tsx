import { useState, useEffect } from "react";
import { Plus, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/integrations/supabase-client";
import { ProductForm } from "@/components/partner/ProductForm";
import { productColumns } from "@/components/partner/ProductColumns";
import { BulkActionsDropdown } from "@/components/products/BulkActionsDropdown";
import { BulkPriceUpdateDialog } from "@/components/products/BulkPriceUpdate";
import { BulkStockUpdateDialog } from "@/components/products/BulkStockUpdate";
import { BulkDeleteConfirmDialog } from "@/components/products/BulkDeleteConfirm";
import { CSVImporterDialog } from "@/components/products/CSVImporter";
import { exportProductsToCSV } from "@/lib/products/csvUtils";

export interface Product {
  id: string;
  name: string;
  description: string;
  short_desc?: string;
  price: number;
  stock: number;
  images: string[];
  is_customizable: boolean;
  add_ons: AddOn[];
  category?: string;
  tags: string[];
  is_active: boolean;
  created_at: string;
}

export interface AddOn {
  id: string;
  name: string;
  price: number;
  moq: number;              // Minimum order quantity
  requiresProof: boolean;   // Customer must upload design/logo
  description?: string;     // Help text (e.g., "Upload logo PNG/SVG")
}

/**
 * Partner Products Page
 * DataTable with CRUD operations
 * Add-ons builder for branding/customization (Swiggy pattern)
 */
export const PartnerProducts = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Bulk operations state
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [showPriceUpdate, setShowPriceUpdate] = useState(false);
  const [showStockUpdate, setShowStockUpdate] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCSVImporter, setShowCSVImporter] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [user]);

  const loadProducts = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('partner_products')
        .select('*')
        .eq('partner_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.warn('Products fetch failed, using mock:', error);
        // Mock products for development
        setProducts([
          {
            id: '1',
            name: 'Premium Gift Hamper',
            description: 'Curated selection of premium items',
            short_desc: 'Perfect for corporate gifting',
            price: 249900,
            stock: 50,
            images: ['/placeholder.svg'],
            is_customizable: true,
            add_ons: [
              { id: '1', name: 'Greeting Card', price: 9900, moq: 1, requiresProof: false },
              { id: '2', name: 'Company Logo', price: 20000, moq: 50, requiresProof: true, description: 'Upload logo PNG/SVG' }
            ],
            category: 'Premium',
            tags: ['trending'],
            is_active: true,
            created_at: new Date().toISOString(),
          },
        ]);
      } else {
        setProducts(data || []);
      }
    } catch (error) {
      console.error('Load products error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('partner_products')
        .delete()
        .eq('id', productId);
      
      if (error) throw error;
      
      toast({
        title: "Product deleted",
        description: "Product removed successfully",
      });
      
      loadProducts();
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleFormSuccess = () => {
    setShowProductForm(false);
    setEditingProduct(null);
    loadProducts();
  };

  // Bulk operations handlers
  const selectedCount = selectedProducts.length;

  const handleBulkAction = (action: string) => {
    switch (action) {
      case 'clear':
        setSelectedProducts([]);
        break;
      case 'update_price':
        setShowPriceUpdate(true);
        break;
      case 'update_stock':
        setShowStockUpdate(true);
        break;
      case 'delete':
        setShowDeleteConfirm(true);
        break;
      case 'export_selected':
        exportProductsToCSV(selectedProducts, `selected-products-${Date.now()}.csv`);
        toast({
          title: "Export successful",
          description: `Exported ${selectedCount} product(s)`,
        });
        break;
    }
  };

  const handleBulkOperationSuccess = () => {
    setSelectedProducts([]);
    loadProducts();
  };

  const handleExportAll = () => {
    exportProductsToCSV(products);
    toast({
      title: "Export successful",
      description: `Exported ${products.length} product(s)`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground">
              Manage your product catalog and add-ons
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCSVImporter(true)} className="gap-2">
              <Upload className="h-4 w-4" />
              Import CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportAll} className="gap-2">
              <Download className="h-4 w-4" />
              Export All
            </Button>
            <Button onClick={handleAddProduct} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Bulk Actions Bar (shows when products selected) */}
        <BulkActionsDropdown
          selectedCount={selectedCount}
          onAction={handleBulkAction}
        />
      </div>

      {/* Products DataTable with Row Selection */}
      <DataTable
        columns={productColumns({ onEdit: handleEditProduct, onDelete: handleDeleteProduct })}
        data={products}
        searchKey="name"
        searchPlaceholder="Search products..."
        onRowSelectionChange={setSelectedProducts}
      />

      {/* Product Form Sheet (Add/Edit with add-ons builder) */}
      <Sheet open={showProductForm} onOpenChange={setShowProductForm}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </SheetTitle>
          </SheetHeader>
          <ProductForm
            product={editingProduct}
            onSuccess={handleFormSuccess}
            onCancel={() => setShowProductForm(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Bulk Operations Dialogs */}
      <BulkPriceUpdateDialog
        open={showPriceUpdate}
        onOpenChange={setShowPriceUpdate}
        selectedProducts={selectedProducts}
        onSuccess={handleBulkOperationSuccess}
      />

      <BulkStockUpdateDialog
        open={showStockUpdate}
        onOpenChange={setShowStockUpdate}
        selectedProducts={selectedProducts}
        onSuccess={handleBulkOperationSuccess}
      />

      <BulkDeleteConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        selectedProducts={selectedProducts}
        onSuccess={handleBulkOperationSuccess}
      />

      <CSVImporterDialog
        open={showCSVImporter}
        onOpenChange={setShowCSVImporter}
        onSuccess={loadProducts}
      />
    </div>
  );
};

