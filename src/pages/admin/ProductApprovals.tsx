/**
 * Admin Product Approvals Page
 * Review and approve partner products before they go live
 * Follows Swiggy/Zomato menu approval pattern
 */

import { useState, useEffect } from "react";
import { Package, CheckCircle2, XCircle, AlertCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { StatsCard } from "@/components/shared/StatsCard";
import { ProductApprovalCard } from "@/components/admin/mobile/ProductApprovalCard";
import { ProductPreviewDialog } from "@/components/admin/products/ProductPreviewDialog";
import { BulkApprovalActions } from "@/components/admin/products/BulkApprovalActions";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/integrations/supabase-client";
import type { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";

interface PendingProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  partner_id: string;
  partner_name: string;
  approval_status: 'pending_review' | 'approved' | 'rejected' | 'changes_requested';
  created_at: string;
  requires_fssai: boolean;
  fssai_verified?: boolean;
}

export const AdminProductApprovals = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<PendingProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [previewProduct, setPreviewProduct] = useState<PendingProduct | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('partner_products')
        .select(`
          *,
          partner_profiles!inner(business_name)
        `)
        .in('approval_status', ['pending_review', 'changes_requested'])
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Products fetch failed, using mock:', error);
        // Mock data for development
        setProducts([
          {
            id: '1',
            name: 'Premium Diwali Gift Hamper',
            description: 'Curated hamper with chocolates, candles, and decorative items',
            price: 249900,
            images: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzE4NS42IDE1MCAxNzQgMTYxLjYgMTc0IDE3NkMxNzQgMTkwLjQgMTg1LjYgMjAyIDE5OSAyMDJDMjEyLjQgMjAyIDIyNCAxOTAuNCAyMjQgMTc2QzIyNCAxNjEuNiAyMTIuNCAxNTAgMjAwIDE1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE4MCAyMDBMMjAwIDE4MEwyMjAgMjAwTDIwMCAyMjBMMTgwIDIwMFoiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+photo-1607344645866-009c320b63e0'],
            category: 'premium',
            partner_id: 'p1',
            partner_name: 'GiftCraft Premium',
            approval_status: 'pending_review',
            created_at: new Date().toISOString(),
            requires_fssai: false,
          },
          {
            id: '2',
            name: 'Artisan Chocolate Box',
            description: 'Handmade chocolates with premium packaging',
            price: 129900,
            images: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzE4NS42IDE1MCAxNzQgMTYxLjYgMTc0IDE3NkMxNzQgMTkwLjQgMTg1LjYgMjAyIDE5OSAyMDJDMjEyLjQgMjAyIDIyNCAxOTAuNCAyMjQgMTc2QzIyNCAxNjEuNiAyMTIuNCAxNTAgMjAwIDE1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE4MCAyMDBMMjAwIDE4MEwyMjAgMjAwTDIwMCAyMjBMMTgwIDIwMFoiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+photo-1511381939415-e44015466834'],
            category: 'chocolates',
            partner_id: 'p2',
            partner_name: 'ChocoDelight',
            approval_status: 'pending_review',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            requires_fssai: true,
            fssai_verified: false,
          },
        ]);
      } else {
        const formattedData = (data || []).map(p => ({
          ...p,
          partner_name: p.partner_profiles?.business_name || 'Unknown Partner',
          requires_fssai: ['food', 'perishables', 'chocolates'].includes(p.category),
        }));
        setProducts(formattedData);
      }
    } catch (error) {
      console.error('Load products error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "No products selected",
        description: "Please select products to approve",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('partner_products')
        .update({
          approval_status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          reviewed_at: new Date().toISOString(),
        })
        .in('id', selectedProducts);

      if (error) throw error;

      toast({
        title: "Products approved",
        description: `${selectedProducts.length} product(s) are now live`,
      });

      setSelectedProducts([]);
      loadProducts();
    } catch (error: any) {
      toast({
        title: "Approval failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleApprove = async (productId: string) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('partner_products')
        .update({
          approval_status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Product approved",
        description: "Product is now live for customers",
      });

      loadProducts();
    } catch (error: any) {
      toast({
        title: "Approval failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (productId: string, reason: string) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('partner_products')
        .update({
          approval_status: 'rejected',
          approved_by: user?.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Product rejected",
        description: "Partner will be notified",
      });

      loadProducts();
    } catch (error: any) {
      toast({
        title: "Rejection failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const columns: ColumnDef<PendingProduct>[] = [
    {
      accessorKey: 'name',
      header: 'Product',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <img
            src={row.original.images[0]}
            alt={row.original.name}
            className="w-12 h-12 rounded object-cover"
          />
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.partner_name}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.category}</Badge>
      ),
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }) => (
        <span className="font-medium">₹{(row.original.price / 100).toLocaleString('en-IN')}</span>
      ),
    },
    {
      accessorKey: 'compliance',
      header: 'Compliance',
      cell: ({ row }) => {
        if (!row.original.requires_fssai) {
          return <Badge variant="default" className="text-xs">✓ OK</Badge>;
        }
        return row.original.fssai_verified ? (
          <Badge variant="default" className="text-xs">✓ FSSAI OK</Badge>
        ) : (
          <Badge variant="destructive" className="text-xs">⚠ FSSAI Missing</Badge>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Submitted',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(row.original.created_at), { addSuffix: true })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPreviewProduct(row.original)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => handleApprove(row.original.id)}
            disabled={processing}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle2 className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              const reason = prompt('Rejection reason:');
              if (reason) handleReject(row.original.id, reason);
            }}
            disabled={processing}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const pendingCount = products.filter(p => p.approval_status === 'pending_review').length;
  const changesRequestedCount = products.filter(p => p.approval_status === 'changes_requested').length;

  if (loading) {
    return <div className="p-8 text-center">Loading products...</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Product Approvals</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Review and approve partner products before they go live
        </p>
      </div>

      {/* Stats - Mobile: 2 col, Desktop: 4 col */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-4">
        <StatsCard
          title="Pending Review"
          value={pendingCount}
          icon={AlertCircle}
          trend="Awaiting approval"
        />
        <StatsCard
          title="Changes Requested"
          value={changesRequestedCount}
          icon={Package}
          trend="Partner action needed"
        />
        <StatsCard
          title="Total in Queue"
          value={products.length}
          icon={Package}
          trend={products.length > 0 ? "Review within 24h" : "All clear!"}
        />
        <StatsCard
          title="Avg Review Time"
          value="4.5h"
          icon={CheckCircle2}
          trend="Target: <6h"
        />
      </div>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <BulkApprovalActions
              selectedCount={selectedProducts.length}
              onBulkApprove={handleBulkApprove}
              onBulkReject={() => {
                const reason = prompt('Rejection reason for all selected:');
                if (reason) {
                  selectedProducts.forEach(id => handleReject(id, reason));
                }
              }}
              processing={processing}
            />
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
          <TabsTrigger value="changes">Changes Requested ({changesRequestedCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {pendingCount === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">All caught up!</h3>
                <p className="text-sm text-muted-foreground">
                  No products awaiting review
                </p>
              </CardContent>
            </Card>
          ) : isMobile ? (
            <div className="space-y-3">
              {products.filter(p => p.approval_status === 'pending_review').map(product => (
                <ProductApprovalCard
                  key={product.id}
                  product={product}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onPreview={setPreviewProduct}
                  selected={selectedProducts.includes(product.id)}
                  onSelect={(id, selected) => {
                    setSelectedProducts(prev =>
                      selected ? [...prev, id] : prev.filter(p => p !== id)
                    );
                  }}
                />
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={products.filter(p => p.approval_status === 'pending_review')}
              onSelectionChange={setSelectedProducts}
            />
          )}
        </TabsContent>

        <TabsContent value="changes" className="mt-4">
          {isMobile ? (
            <div className="space-y-3">
              {products.filter(p => p.approval_status === 'changes_requested').map(product => (
                <ProductApprovalCard
                  key={product.id}
                  product={product}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onPreview={setPreviewProduct}
                />
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={products.filter(p => p.approval_status === 'changes_requested')}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Product Preview Dialog */}
      {previewProduct && (
        <ProductPreviewDialog
          product={previewProduct}
          onClose={() => setPreviewProduct(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
};

