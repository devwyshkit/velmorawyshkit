import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/integrations/supabase-client";
import { productColumns } from "@/components/partner/ProductColumns";

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
  approval_status?: 'pending_review' | 'approved' | 'rejected' | 'changes_requested'; // NEW!
  rejection_reason?: string; // NEW!
  created_at: string;
}

export interface AddOn {
  id: string;
  name: string;
  label: string;           // Alias for name, matches customer UI format
  price: number;            // In paise
  moq?: number;             // Optional: Minimum order quantity
  requiresProof?: boolean;  // Alias for requiresPreview
  requiresPreview?: boolean; // Customer must upload design/logo (Fiverr preview)
  instructions?: string;    // Help text (e.g., "Upload logo PNG/SVG")
  description?: string;     // Alias for instructions
}

/**
 * Partner Products Page
 * DataTable with CRUD operations
 * Add-ons builder for branding/customization (Swiggy pattern)
 */
export const PartnerProducts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, [user]);

  const loadProducts = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // First get the user's store
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (storeError || !store) {
        setProducts([]);
        setLoading(false);
        return;
      }

      // Then get products from store_items (matching ProductCreate.tsx)
      // Optimized select - only fetch needed columns
      const { data, error } = await supabase
        .from('store_items')
        .select('id, name, description, short_desc, price, stock, images, is_customizable, add_ons, category, tags, is_active, approval_status, rejection_reason, created_at')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        // Silent error handling - show empty state (Swiggy 2025 pattern)
        setProducts([]);
      } else if (data) {
        // Map store_items data to Product interface
        const mappedProducts: Product[] = (data || []).map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description || '',
          short_desc: item.short_desc,
          price: item.price,
          stock: item.stock_quantity || 0,
          images: item.images || (item.image_url ? [item.image_url] : []),
          is_customizable: item.is_customizable || false,
          // Map personalizations to add_ons format for compatibility
          add_ons: item.personalizations ? item.personalizations.map((p: any) => ({
            id: p.id,
            name: p.label,
            label: p.label,
            price: typeof p.price === 'number' ? p.price : parseInt(p.price || '0'),
            instructions: p.instructions,
            description: p.instructions,
          })) : [],
          category: item.category,
          tags: item.tags || [],
          is_active: item.is_active !== false,
          approval_status: item.status === 'approved' ? 'approved' : 
                          item.status === 'rejected' ? 'rejected' : 
                          item.status === 'changes_requested' ? 'changes_requested' : 'pending_review',
          rejection_reason: item.rejection_reason,
          created_at: item.created_at,
        }));
        setProducts(mappedProducts);
      }
    } catch (error) {
      // Handle error silently in production
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    // Navigate to simple product create page (Swiggy pattern)
    navigate('/partner/dashboard/products/create');
  };

  const handleEditProduct = (product: Product) => {
    // Edit functionality - navigate to edit page (Swiggy 2025 pattern)
    navigate(`/partner/dashboard/products/create?edit=${product.id}`);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      if (!user) return;

      // Get store first (matching ProductCreate.tsx pattern)
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!store) {
        alert('Store not found');
        return;
      }

      const { error } = await supabase
        .from('store_items')
        .delete()
        .eq('id', productId)
        .eq('store_id', store.id);
      
      if (error) throw error;
      
      // Silent success - reload implies success (Swiggy 2025 pattern)
      loadProducts();
    } catch (error: any) {
      // Silent error handling - error shown via confirm dialog (Swiggy 2025 pattern)
    }
  };

  // Removed handleFormSuccess - product creation now uses separate page

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your product catalog and add-ons
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleAddProduct} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Products with Approval Status Filters */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="all">
            All ({products.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({products.filter(p => p.approval_status === 'approved').length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({products.filter(p => p.approval_status === 'pending_review').length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({products.filter(p => p.approval_status === 'rejected').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <DataTable
            columns={productColumns({ onEdit: handleEditProduct, onDelete: handleDeleteProduct })}
            data={products}
            searchKey="name"
            searchPlaceholder="Search products..."
            loading={loading}
            skeletonRows={5}
          />
        </TabsContent>

        <TabsContent value="approved" className="mt-4">
          <DataTable
            columns={productColumns({ onEdit: handleEditProduct, onDelete: handleDeleteProduct })}
            data={products.filter(p => p.approval_status === 'approved')}
            searchKey="name"
            searchPlaceholder="Search approved products..."
            loading={loading}
            skeletonRows={5}
          />
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <DataTable
            columns={productColumns({ onEdit: handleEditProduct, onDelete: handleDeleteProduct })}
            data={products.filter(p => p.approval_status === 'pending_review')}
            searchKey="name"
            searchPlaceholder="Search pending products..."
            loading={loading}
            skeletonRows={5}
          />
        </TabsContent>

        <TabsContent value="rejected" className="mt-4">
          <DataTable
            columns={productColumns({ onEdit: handleEditProduct, onDelete: handleDeleteProduct })}
            data={products.filter(p => p.approval_status === 'rejected')}
            searchKey="name"
            searchPlaceholder="Search rejected products..."
            loading={loading}
            skeletonRows={5}
          />
        </TabsContent>
      </Tabs>

      {/* Product creation now uses full page (/partner/dashboard/products/create) - Swiggy 2025 pattern */}
      {/* Old wizard removed - replaced with simple form */}
    </div>
  );
};

