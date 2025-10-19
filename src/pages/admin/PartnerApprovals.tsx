import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/integrations/supabase-client";
import { ApprovalDetail } from "@/components/admin/ApprovalDetail";
import { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/shared/StatusBadge";

interface PendingPartner {
  id: string;
  business_name: string;
  category: string;
  submitted_at: string;
  pan_number: string;
  gst_number: string;
  fssai_number?: string;
  status: string;
}

/**
 * Admin Partner Approvals Page
 * Review KYC documents and approve/reject partners
 * Follows Zomato admin console pattern
 */
export const AdminPartnerApprovals = () => {
  const { toast } = useToast();
  const [partners, setPartners] = useState<PendingPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<PendingPartner | null>(null);

  useEffect(() => {
    loadPendingPartners();
  }, []);

  const loadPendingPartners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('partner_profiles')
        .select('*')
        .eq('status', 'pending')
        .order('submitted_at', { ascending: true });
      
      if (error) {
        console.warn('Partners fetch failed, using mock:', error);
        // Mock pending partners
        setPartners([
          {
            id: '1',
            business_name: 'Sweet Delights Co.',
            category: 'chocolates',
            submitted_at: new Date().toISOString(),
            pan_number: 'ABCDE1234F',
            gst_number: '22AAAAA0000A1Z5',
            status: 'pending',
          },
          {
            id: '2',
            business_name: 'Fresh Foods Pvt Ltd',
            category: 'food',
            submitted_at: new Date(Date.now() - 3600000).toISOString(),
            pan_number: 'FGHIJ5678K',
            gst_number: '29BBBBB1111B2Z6',
            fssai_number: '12345678901234',
            status: 'pending',
          },
        ]);
      } else {
        setPartners(data || []);
      }
    } catch (error) {
      console.error('Load partners error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (partnerId: string) => {
    try {
      const { error } = await supabase
        .from('partner_profiles')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          // approved_by would be current admin user ID
        })
        .eq('id', partnerId);
      
      if (error) throw error;
      
      toast({
        title: "Partner approved",
        description: "Partner has been notified and can now access dashboard",
      });
      
      loadPendingPartners();
      setSelectedPartner(null);
    } catch (error: any) {
      toast({
        title: "Approval failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReject = async (partnerId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('partner_profiles')
        .update({
          status: 'rejected',
          rejection_reason: reason,
        })
        .eq('id', partnerId);
      
      if (error) throw error;
      
      toast({
        title: "Partner rejected",
        description: "Partner has been notified with rejection reason",
      });
      
      loadPendingPartners();
      setSelectedPartner(null);
    } catch (error: any) {
      toast({
        title: "Rejection failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const columns: ColumnDef<PendingPartner>[] = [
    {
      accessorKey: "business_name",
      header: "Business Name",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.business_name}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {row.original.category.replace('_', ' ')}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "submitted_at",
      header: "Submitted",
      cell: ({ row }) => (
        <span className="text-sm">
          {new Date(row.original.submitted_at).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      ),
    },
    {
      accessorKey: "pan_number",
      header: "PAN",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.pan_number}</span>
      ),
    },
    {
      accessorKey: "fssai_number",
      header: "FSSAI",
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {row.original.fssai_number || <span className="text-muted-foreground">N/A</span>}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status as any} />,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedPartner(row.original)}
          className="gap-2"
        >
          <Eye className="h-3 w-3" />
          Review
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Partner Approvals</h1>
        <p className="text-muted-foreground">
          Review and approve partner applications
        </p>
      </div>

      <DataTable
        columns={columns}
        data={partners}
        searchKey="business_name"
        searchPlaceholder="Search partners..."
      />

      {/* Approval Detail Sheet */}
      <Sheet open={!!selectedPartner} onOpenChange={() => setSelectedPartner(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Review Application</SheetTitle>
          </SheetHeader>
          {selectedPartner && (
            <ApprovalDetail
              partner={selectedPartner}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

