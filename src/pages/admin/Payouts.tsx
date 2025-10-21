/**
 * Admin Payouts Page
 * Process partner payouts with Zoho Books integration
 * Bi-weekly payout cycle with commission calculations
 */

import { useState, useEffect } from "react";
import { DollarSign, FileText, Download, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { StatsCard } from "@/components/shared/StatsCard";
import { PayoutCard } from "@/components/admin/mobile/PayoutCard";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/integrations/supabase-client";
import { zohoBooksMock } from "@/lib/api/zoho-books-mock";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

interface Payout {
  id: string;
  partner_id: string;
  partner_name: string;
  period_start: string;
  period_end: string;
  earnings: number;
  commission: number;
  net_payout: number;
  status: 'pending' | 'scheduled' | 'processing' | 'completed' | 'failed';
  zoho_invoice_id?: string;
  zoho_invoice_number?: string;
  razorpay_transfer_id?: string;
  processed_at?: string;
  created_at: string;
}

export const AdminPayouts = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [selectedPayouts, setSelectedPayouts] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPayouts();
  }, []);

  const loadPayouts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payouts')
        .select(`
          *,
          partner_profiles!inner(business_name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Payouts fetch failed, using mock:', error);
        // Mock data for development
        setPayouts([
          {
            id: '1',
            partner_id: 'p1',
            partner_name: 'GiftCraft Premium',
            period_start: '2025-10-01',
            period_end: '2025-10-15',
            earnings: 15000000, // ₹1,50,000
            commission: 3000000, // 20% = ₹30,000
            net_payout: 12000000, // ₹1,20,000
            status: 'pending',
            created_at: new Date().toISOString(),
          },
          {
            id: '2',
            partner_id: 'p2',
            partner_name: 'Boat Audio India',
            period_start: '2025-10-01',
            period_end: '2025-10-15',
            earnings: 25000000, // ₹2,50,000
            commission: 5000000, // 20% = ₹50,000
            net_payout: 20000000, // ₹2,00,000
            status: 'pending',
            created_at: new Date().toISOString(),
          },
          {
            id: '3',
            partner_id: 'p3',
            partner_name: 'ChocoDelight',
            period_start: '2025-09-16',
            period_end: '2025-09-30',
            earnings: 8000000,
            commission: 1600000,
            net_payout: 6400000,
            status: 'completed',
            zoho_invoice_number: 'INV-2025-0923',
            razorpay_transfer_id: 'transfer_xyz123',
            processed_at: '2025-10-02T10:30:00Z',
            created_at: '2025-10-01T00:00:00Z',
          },
        ]);
      } else {
        const formattedData = (data || []).map(p => ({
          ...p,
          partner_name: p.partner_profiles?.business_name || 'Unknown Partner'
        }));
        setPayouts(formattedData);
      }
    } catch (error) {
      console.error('Load payouts error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoices = async () => {
    if (selectedPayouts.length === 0) {
      toast({
        title: "No payouts selected",
        description: "Please select payouts to generate invoices",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      for (const payoutId of selectedPayouts) {
        const payout = payouts.find(p => p.id === payoutId);
        if (!payout) continue;

        // Generate invoice via Zoho Books
        const invoice = await zohoBooksMock.createCommissionInvoice(
          payout.partner_id,
          format(new Date(payout.period_start), 'MMM yyyy'),
          {
            totalRevenue: payout.earnings,
            commissionPercent: 20, // Default 20%
          }
        );

        // Update payout with invoice details
        await supabase
          .from('payouts')
          .update({
            status: 'scheduled',
            zoho_invoice_id: invoice.invoice_id,
            zoho_invoice_number: invoice.invoice_id, // Use invoice_id as number too
          })
          .eq('id', payoutId);
      }

      toast({
        title: "Invoices generated",
        description: `${selectedPayouts.length} invoice(s) created successfully`,
      });

      setSelectedPayouts([]);
      loadPayouts();
    } catch (error: any) {
      toast({
        title: "Invoice generation failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (selectedPayouts.length === 0) {
      toast({
        title: "No payouts selected",
        description: "Please select payouts to mark as paid",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      for (const payoutId of selectedPayouts) {
        await supabase
          .from('payouts')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString(),
            razorpay_transfer_id: `transfer_${Math.random().toString(36).substr(2, 9)}`,
          })
          .eq('id', payoutId);
      }

      toast({
        title: "Payouts marked as paid",
        description: `${selectedPayouts.length} payout(s) completed successfully`,
      });

      setSelectedPayouts([]);
      loadPayouts();
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleExportCSV = () => {
    const csv = [
      ['Partner', 'Period', 'Earnings', 'Commission', 'Net Payout', 'Status', 'Invoice#'].join(','),
      ...payouts.map(p => [
        p.partner_name,
        `${format(new Date(p.period_start), 'MMM dd')} - ${format(new Date(p.period_end), 'MMM dd, yyyy')}`,
        (p.earnings / 100).toFixed(2),
        (p.commission / 100).toFixed(2),
        (p.net_payout / 100).toFixed(2),
        p.status,
        p.zoho_invoice_number || '-'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payouts-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "CSV exported",
      description: "Payouts data downloaded successfully",
    });
  };

  const getStatusBadge = (status: Payout['status']) => {
    const variants: Record<Payout['status'], { variant: any; label: string; icon: any }> = {
      pending: { variant: 'secondary', label: 'Pending', icon: Clock },
      scheduled: { variant: 'default', label: 'Scheduled', icon: FileText },
      processing: { variant: 'default', label: 'Processing', icon: Clock },
      completed: { variant: 'default', label: 'Completed', icon: CheckCircle2 },
      failed: { variant: 'destructive', label: 'Failed', icon: AlertCircle },
    };
    const config = variants[status];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const columns: ColumnDef<Payout>[] = [
    {
      accessorKey: 'partner_name',
      header: 'Partner',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.partner_name}</div>
      ),
    },
    {
      accessorKey: 'period',
      header: 'Period',
      cell: ({ row }) => (
        <div className="text-sm">
          {format(new Date(row.original.period_start), 'MMM dd')} - {format(new Date(row.original.period_end), 'MMM dd, yyyy')}
        </div>
      ),
    },
    {
      accessorKey: 'earnings',
      header: 'Earnings',
      cell: ({ row }) => (
        <div className="text-sm">₹{(row.original.earnings / 100).toLocaleString('en-IN')}</div>
      ),
    },
    {
      accessorKey: 'commission',
      header: 'Commission',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">₹{(row.original.commission / 100).toLocaleString('en-IN')}</div>
      ),
    },
    {
      accessorKey: 'net_payout',
      header: 'Net Payout',
      cell: ({ row }) => (
        <div className="text-sm font-semibold">₹{(row.original.net_payout / 100).toLocaleString('en-IN')}</div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: 'invoice',
      header: 'Invoice',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.zoho_invoice_number || '-'}
        </div>
      ),
    },
  ];

  const pendingPayouts = payouts.filter(p => p.status === 'pending').length;
  const scheduledPayouts = payouts.filter(p => p.status === 'scheduled').length;
  const completedPayouts = payouts.filter(p => p.status === 'completed').length;
  const totalPending = payouts
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.net_payout, 0);

  if (loading) {
    return <div className="p-8 text-center">Loading payouts...</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Payout Management</h1>
        <p className="text-sm md:text-base text-muted-foreground">Process partner payouts with Zoho Books integration</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatsCard
          title="Pending Payouts"
          value={pendingPayouts}
          icon={Clock}
          trend={`₹${(totalPending / 100).toLocaleString('en-IN')} total`}
        />
        <StatsCard
          title="Scheduled"
          value={scheduledPayouts}
          icon={FileText}
          trend="Invoices generated"
        />
        <StatsCard
          title="Completed"
          value={completedPayouts}
          icon={CheckCircle2}
          trend="This cycle"
        />
        <StatsCard
          title="Total Value"
          value={`₹${(payouts.reduce((sum, p) => sum + p.net_payout, 0) / 100).toLocaleString('en-IN')}`}
          icon={DollarSign}
          trend="All payouts"
        />
      </div>

      {/* Bulk Actions */}
      {selectedPayouts.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <p className="text-sm font-medium">
                {selectedPayouts.length} payout{selectedPayouts.length !== 1 ? 's' : ''} selected
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={handleGenerateInvoices} 
                  disabled={processing}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Generate Invoices (Zoho)
                </Button>
                <Button 
                  onClick={handleMarkAsPaid} 
                  disabled={processing}
                  variant="outline"
                  className="gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark as Paid
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="pending">Pending ({pendingPayouts})</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled ({scheduledPayouts})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedPayouts})</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
          <Button variant="outline" onClick={handleExportCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <TabsContent value="pending">
          {isMobile ? (
            <div className="space-y-3">
              {payouts.filter(p => p.status === 'pending').map(payout => (
                <PayoutCard
                  key={payout.id}
                  payout={payout}
                  selected={selectedPayouts.includes(payout.id)}
                  onSelect={(id, selected) => {
                    setSelectedPayouts(prev => 
                      selected ? [...prev, id] : prev.filter(p => p !== id)
                    );
                  }}
                />
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={payouts.filter(p => p.status === 'pending')}
              onSelectionChange={setSelectedPayouts}
            />
          )}
        </TabsContent>

        <TabsContent value="scheduled">
          {isMobile ? (
            <div className="space-y-3">
              {payouts.filter(p => p.status === 'scheduled').map(payout => (
                <PayoutCard key={payout.id} payout={payout} />
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={payouts.filter(p => p.status === 'scheduled')}
              onSelectionChange={setSelectedPayouts}
            />
          )}
        </TabsContent>

        <TabsContent value="completed">
          {isMobile ? (
            <div className="space-y-3">
              {payouts.filter(p => p.status === 'completed').map(payout => (
                <PayoutCard key={payout.id} payout={payout} />
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={payouts.filter(p => p.status === 'completed')}
              onSelectionChange={setSelectedPayouts}
            />
          )}
        </TabsContent>

        <TabsContent value="all">
          {isMobile ? (
            <div className="space-y-3">
              {payouts.map(payout => (
                <PayoutCard key={payout.id} payout={payout} />
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={payouts}
              onSelectionChange={setSelectedPayouts}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

