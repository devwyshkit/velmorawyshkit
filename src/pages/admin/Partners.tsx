import { useState, useEffect } from "react";
import { Users, UserCheck, UserX, Ban, UserCog } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { PartnerApprovalQueue } from "@/components/admin/PartnerApprovalQueue";
import { PartnerCard } from "@/components/admin/mobile/PartnerCard";
import { AssignKAMDialog } from "@/components/admin/kam/AssignKAMDialog";
import { KAMActivityLog } from "@/components/admin/kam/KAMActivityLog";
import { useIsMobile } from "@/hooks/useIsMobile";
import { supabase } from "@/lib/integrations/supabase-client";
import { useToast } from "@/hooks/use-toast";
import type { ColumnDef } from "@tanstack/react-table";

interface ActivePartner {
  id: string;
  business_name: string;
  email: string;
  category: string;
  created_at: string;
  kam_id?: string;
  kam_name?: string;
  kam_email?: string;
  rating?: number;
  total_orders?: number;
}

/**
 * Admin Partner Management
 * Focus: Approval Queue for new partner signups
 * Following Swiggy/Zomato partner approval patterns
 */
export const AdminPartners = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [pendingCount, setPendingCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [suspendedCount, setSuspendedCount] = useState(0);
  const [activePartners, setActivePartners] = useState<ActivePartner[]>([]);
  const [loadingActive, setLoadingActive] = useState(false);
  const [kamDialogOpen, setKamDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<ActivePartner | null>(null);
  const [showKAMActivity, setShowKAMActivity] = useState(false);

  useEffect(() => {
    loadCounts();
  }, []);

  const loadCounts = async () => {
    try {
      // Get counts for each tab
      const { data: approvals } = await supabase
        .from('partner_approvals')
        .select('status');

      if (approvals) {
        setPendingCount(approvals.filter(a => a.status === 'pending').length);
        setRejectedCount(approvals.filter(a => a.status === 'rejected').length);
      }

      const { data: partners } = await supabase
        .from('partners')
        .select('status, is_active');

      if (partners) {
        setActiveCount(partners.filter(p => p.status === 'approved' && p.is_active).length);
        setSuspendedCount(partners.filter(p => !p.is_active).length);
      }
    } catch (error) {
      console.error('Failed to load partner counts:', error);
      
      // Mock data for development
      setPendingCount(18);
      setActiveCount(1250);
      setRejectedCount(42);
      setSuspendedCount(8);
    }
  };

  const loadActivePartners = async () => {
    setLoadingActive(true);
    try {
      const { data, error } = await supabase
        .from('partner_profiles')
        .select(`
          id,
          business_name,
          email,
          category,
          created_at,
          kam_assignments (
            kam_profiles (
              id,
              name,
              email
            )
          )
        `)
        .eq('status', 'approved')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Active partners fetch failed, using mock:', error);
        // Mock data
        setActivePartners([
          {
            id: '1',
            business_name: 'GiftCraft Premium',
            email: 'contact@giftcraft.com',
            category: 'premium',
            created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
            kam_name: 'Rajesh Kumar',
            kam_email: 'rajesh@wyshkit.com',
            rating: 4.8,
            total_orders: 245,
          },
          {
            id: '2',
            business_name: 'ChocoDelight',
            email: 'admin@chocodelight.com',
            category: 'chocolates',
            created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
            rating: 4.6,
            total_orders: 189,
          },
        ]);
      } else {
        const formatted = (data || []).map((p: any) => ({
          id: p.id,
          business_name: p.business_name,
          email: p.email,
          category: p.category,
          created_at: p.created_at,
          kam_id: p.kam_assignments?.[0]?.kam_profiles?.id,
          kam_name: p.kam_assignments?.[0]?.kam_profiles?.name,
          kam_email: p.kam_assignments?.[0]?.kam_profiles?.email,
        }));
        setActivePartners(formatted);
      }
    } catch (error) {
      console.error('Load active partners error:', error);
    } finally {
      setLoadingActive(false);
    }
  };

  const handleAssignKAM = (partner: ActivePartner) => {
    setSelectedPartner(partner);
    setKamDialogOpen(true);
  };

  const handleKAMAssignSuccess = () => {
    setKamDialogOpen(false);
    setSelectedPartner(null);
    loadActivePartners();
    toast({
      title: "KAM assigned successfully",
      description: "The partner has been assigned to a KAM",
    });
  };

  // Columns for Active Partners DataTable
  const activePartnerColumns: ColumnDef<ActivePartner>[] = [
    {
      accessorKey: "business_name",
      header: "Business Name",
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        const category = row.original.category?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        return <Badge variant="secondary">{category}</Badge>;
      },
    },
    {
      accessorKey: "kam_name",
      header: "Assigned KAM",
      cell: ({ row }) => {
        if (row.original.kam_name) {
          return (
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                <UserCog className="h-3 w-3 mr-1" />
                {row.original.kam_name}
              </Badge>
            </div>
          );
        }
        return <span className="text-muted-foreground text-sm">Not assigned</span>;
      },
    },
    {
      accessorKey: "rating",
      header: "Rating",
      cell: ({ row }) => {
        if (row.original.rating) {
          return <span>⭐ {row.original.rating.toFixed(1)}</span>;
        }
        return <span className="text-muted-foreground text-sm">N/A</span>;
      },
    },
    {
      accessorKey: "total_orders",
      header: "Orders",
      cell: ({ row }) => {
        return <span className="font-medium">{row.original.total_orders || 0}</span>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAssignKAM(row.original)}
          >
            <UserCog className="h-4 w-4 mr-1" />
            {row.original.kam_name ? 'Change KAM' : 'Assign KAM'}
          </Button>
        );
      },
    },
  ];

  // Load active partners when tab is selected
  useEffect(() => {
    loadActivePartners();
  }, []);

  return (
    <div className="space-y-4 md:space-y-6 pb-20 md:pb-6">
      {/* Page Header - Responsive */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Partner Management</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Review and approve new partner applications
        </p>
      </div>

      {/* Tabs for different partner states - Mobile responsive */}
      <Tabs defaultValue="approval-queue" className="space-y-3 md:space-y-4">
        <TabsList className="grid w-full grid-cols-4 h-auto">

          <TabsTrigger value="approval-queue" className="gap-1 text-xs md:text-sm px-2 md:px-3 py-2">
            <Users className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Queue</span>
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-0.5 h-4 min-w-4 px-1 text-[10px]">{pendingCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-1 text-xs md:text-sm px-2 md:px-3 py-2">
            <UserCheck className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Active</span>
            {activeCount > 0 && (
              <Badge variant="outline" className="ml-0.5 h-4 min-w-4 px-1 text-[10px]">{activeCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-1 text-xs md:text-sm px-2 md:px-3 py-2">
            <UserX className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Rejected</span>
            {rejectedCount > 0 && (
              <Badge variant="outline" className="ml-0.5 h-4 min-w-4 px-1 text-[10px]">{rejectedCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="suspended" className="gap-1 text-xs md:text-sm px-2 md:px-3 py-2">
            <Ban className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Suspended</span>
            {suspendedCount > 0 && (
              <Badge variant="outline" className="ml-0.5 h-4 min-w-4 px-1 text-[10px]">{suspendedCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Approval Queue Tab (Most Important) */}
        <TabsContent value="approval-queue">
          <PartnerApprovalQueue onApprovalChange={loadCounts} />
        </TabsContent>

        {/* Active Partners Tab */}
        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Active Partners ({activeCount})</span>
                <Badge variant="secondary" onClick={() => setShowKAMActivity(!showKAMActivity)} className="cursor-pointer">
                  <UserCog className="h-3 w-3 mr-1" />
                  {showKAMActivity ? 'Show Partners' : 'KAM Activity'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showKAMActivity ? (
                <KAMActivityLog />
              ) : (
                <>
                  {isMobile ? (
                    <div className="space-y-3">
                      {activePartners.map(partner => (
                        <PartnerCard
                          key={partner.id}
                          partner={{
                            id: partner.id,
                            name: partner.business_name,
                            email: partner.email,
                            category: partner.category,
                            submitted_at: partner.created_at,
                            kyc_pan_verified: true,
                            kyc_gst_verified: true,
                            kyc_bank_verified: true,
                            kam_name: partner.kam_name,
                            kam_email: partner.kam_email,
                          }}
                          onAssignKAM={() => handleAssignKAM(partner)}
                        />
                      ))}
                    </div>
                  ) : (
                    <DataTable
                      columns={activePartnerColumns}
                      data={activePartners}
                      loading={loadingActive}
                      skeletonRows={5}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rejected Partners Tab */}
        <TabsContent value="rejected">
          <Card>
            <CardHeader>
              <CardTitle>Rejected Applications ({rejectedCount})</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Rejected partners with reasons will be displayed here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suspended Partners Tab */}
        <TabsContent value="suspended">
          <Card>
            <CardHeader>
              <CardTitle>Suspended Partners ({suspendedCount})</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Suspended partners (policy violations) will be displayed here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* KAM Assignment Dialog */}
      {selectedPartner && (
        <AssignKAMDialog
          partnerId={selectedPartner.id}
          partnerName={selectedPartner.business_name}
          currentKAMId={selectedPartner.kam_id}
          open={kamDialogOpen}
          onClose={() => setKamDialogOpen(false)}
          onSuccess={handleKAMAssignSuccess}
        />
      )}
    </div>
  );
};

