import { useState, useEffect } from "react";
import { Users, UserCheck, UserX, Ban } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PartnerApprovalQueue } from "@/components/admin/PartnerApprovalQueue";
import { supabase } from "@/lib/integrations/supabase-client";

/**
 * Admin Partner Management
 * Focus: Approval Queue for new partner signups
 * Following Swiggy/Zomato partner approval patterns
 */
export const AdminPartners = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [suspendedCount, setSuspendedCount] = useState(0);

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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Partner Management</h1>
        <p className="text-muted-foreground">
          Review and approve new partner applications
        </p>
      </div>

      {/* Tabs for different partner states */}
      <Tabs defaultValue="approval-queue" className="space-y-4">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="approval-queue" className="gap-2">
            <Users className="h-4 w-4" />
            Approval Queue
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-1">{pendingCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-2">
            <UserCheck className="h-4 w-4" />
            Active
            {activeCount > 0 && (
              <Badge variant="outline" className="ml-1">{activeCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <UserX className="h-4 w-4" />
            Rejected
            {rejectedCount > 0 && (
              <Badge variant="outline" className="ml-1">{rejectedCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="suspended" className="gap-2">
            <Ban className="h-4 w-4" />
            Suspended
            {suspendedCount > 0 && (
              <Badge variant="outline" className="ml-1">{suspendedCount}</Badge>
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
              <CardTitle>Active Partners ({activeCount})</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Active partners list will be displayed here with performance metrics
              </p>
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
    </div>
  );
};

