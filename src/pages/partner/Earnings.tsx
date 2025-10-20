import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, Calendar, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/shared/StatsCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/integrations/supabase-client";
import { ColumnDef } from "@tanstack/react-table";

interface Transaction {
  id: string;
  order_number: string;
  date: string;
  gross_amount: number;
  commission: number;
  payout: number;
  status: string;
}

interface MonthlyInvoice {
  id: string;
  month: string;
  total_revenue: number;
  commission_amount: number;
  zoho_invoice_id?: string;
  zoho_invoice_url?: string;
  status: 'pending' | 'invoiced' | 'paid';
  paid_at?: string;
}

/**
 * Partner Earnings Page
 * Shows revenue, commission breakdown, and transaction history
 * Follows Swiggy/Zomato earnings transparency pattern
 */
export const PartnerEarnings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [weeklyEarnings, setWeeklyEarnings] = useState(0);
  const [pendingPayout, setPendingPayout] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyInvoices, setMonthlyInvoices] = useState<MonthlyInvoice[]>([]);

  useEffect(() => {
    loadEarnings();
    loadMonthlyInvoices();
  }, [user]);

  const loadEarnings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch from partner_earnings view
      const { data, error } = await supabase
        .from('partner_earnings')
        .select('*')
        .eq('partner_id', user.id)
        .gte('week_start', getWeekStart())
        .single();
      
      if (error) {
        console.warn('Earnings fetch failed, using mock:', error);
        // Mock earnings
        setWeeklyEarnings(4500000);  // ₹45,000
        setPendingPayout(1200000);   // ₹12,000
        setTransactions([
          {
            id: '1',
            order_number: 'ORD-12345',
            date: new Date().toISOString(),
            gross_amount: 249900,
            commission: 37485,  // 15%
            payout: 212415,      // 85%
            status: 'completed',
          },
          {
            id: '2',
            order_number: 'ORD-12344',
            date: new Date(Date.now() - 86400000).toISOString(),
            gross_amount: 129900,
            commission: 19485,
            payout: 110415,
            status: 'completed',
          },
        ]);
      } else {
        setWeeklyEarnings(data?.partner_payout || 0);
        setPendingPayout(data?.partner_payout || 0);
        // TODO: Fetch individual transactions
      }
    } catch (error) {
      console.error('Load earnings error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyInvoices = async () => {
    if (!user) return;

    try {
      // Fetch from payouts table (Zoho Books integration)
      const { data, error } = await supabase
        .from('payouts')
        .select('*')
        .eq('partner_id', user.id)
        .order('month', { ascending: false })
        .limit(6); // Last 6 months

      if (error) {
        console.warn('Invoices fetch failed, using mock:', error);
        // Mock invoices (last 3 months)
        setMonthlyInvoices([
          {
            id: '1',
            month: '2024-03',
            total_revenue: 250000,
            commission_amount: 50000,
            zoho_invoice_id: 'INV-2024-03-001',
            zoho_invoice_url: 'https://mock-zoho-books.com/invoice/1',
            status: 'paid',
            paid_at: '2024-04-05',
          },
          {
            id: '2',
            month: '2024-02',
            total_revenue: 200000,
            commission_amount: 40000,
            zoho_invoice_id: 'INV-2024-02-001',
            zoho_invoice_url: 'https://mock-zoho-books.com/invoice/2',
            status: 'paid',
            paid_at: '2024-03-05',
          },
          {
            id: '3',
            month: '2024-01',
            total_revenue: 180000,
            commission_amount: 36000,
            zoho_invoice_id: 'INV-2024-01-001',
            zoho_invoice_url: 'https://mock-zoho-books.com/invoice/3',
            status: 'paid',
            paid_at: '2024-02-05',
          },
        ]);
      } else {
        setMonthlyInvoices(
          data.map((invoice) => ({
            id: invoice.id,
            month: invoice.month,
            total_revenue: invoice.total_revenue,
            commission_amount: invoice.commission_amount,
            zoho_invoice_id: invoice.zoho_invoice_id,
            zoho_invoice_url: invoice.zoho_invoice_url,
            status: invoice.status as 'pending' | 'invoiced' | 'paid',
            paid_at: invoice.paid_at,
          }))
        );
      }
    } catch (error) {
      console.error('Load invoices error:', error);
    }
  };

  // Get Monday of current week
  const getWeekStart = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    return new Date(now.setDate(diff)).toISOString();
  };

  const handleDownloadInvoice = () => {
    // TODO: Generate PDF invoice
    alert('Invoice download coming soon');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Earnings</h1>
          <p className="text-muted-foreground">
            Track your revenue and commission breakdown
          </p>
        </div>
        <Button variant="outline" onClick={handleDownloadInvoice} className="gap-2">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Download Report</span>
        </Button>
      </div>

      {/* Earnings Summary (Swiggy/Zomato pattern) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatsCard
          title="This Week's Earnings"
          value={`₹${(weeklyEarnings / 100).toLocaleString('en-IN')}`}
          icon={TrendingUp}
          trend="+12% from last week"
          trendDirection="up"
        />
        <StatsCard
          title="Pending Payout"
          value={`₹${(pendingPayout / 100).toLocaleString('en-IN')}`}
          icon={DollarSign}
          trend="Paid every Friday"
        />
        <StatsCard
          title="Next Payout"
          value={getNextPayoutDate()}
          icon={Calendar}
          trend="Weekly payouts"
        />
      </div>

      {/* Monthly Invoices (Zoho Books Integration) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            📄 Monthly Commission Invoices
            <span className="text-xs font-normal text-muted-foreground">(Powered by Zoho Books)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyInvoices.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No invoices yet. Your first invoice will be generated at month-end.
            </p>
          ) : (
            <div className="space-y-3">
              {monthlyInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {new Date(invoice.month + '-01').toLocaleDateString('en-IN', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        invoice.status === 'paid'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : invoice.status === 'invoiced'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {invoice.status === 'paid' ? '✓ Paid' : invoice.status === 'invoiced' ? 'Invoiced' : 'Pending'}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Revenue: ₹{(invoice.total_revenue / 100).toLocaleString('en-IN')} • 
                      Commission: ₹{(invoice.commission_amount / 100).toLocaleString('en-IN')}
                    </div>
                    {invoice.paid_at && (
                      <div className="text-xs text-muted-foreground">
                        Paid on {new Date(invoice.paid_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {invoice.zoho_invoice_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(invoice.zoho_invoice_url, '_blank')}
                        className="gap-1"
                      >
                        <Download className="h-3 w-3" />
                        View Invoice
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commission Info (Transparency like Zomato) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Commission Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform Commission</span>
              <span className="font-medium">15%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Your Payout</span>
              <span className="font-medium">85%</span>
            </div>
            <div className="pt-2 border-t text-xs text-muted-foreground">
              💡 Premium partners get reduced commission (12-13%). Earn badges to unlock!
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={transactionColumns}
            data={transactions}
            searchKey="order_number"
            searchPlaceholder="Search by order number..."
          />
        </CardContent>
      </Card>
    </div>
  );
};

// DataTable Columns
const transactionColumns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => new Date(row.original.date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }),
  },
  {
    accessorKey: "order_number",
    header: "Order #",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.order_number}</span>
    ),
  },
  {
    accessorKey: "gross_amount",
    header: "Order Total",
    cell: ({ row }) => `₹${(row.original.gross_amount / 100).toLocaleString('en-IN')}`,
  },
  {
    accessorKey: "commission",
    header: "Commission (15%)",
    cell: ({ row }) => (
      <span className="text-destructive">
        -₹{(row.original.commission / 100).toLocaleString('en-IN')}
      </span>
    ),
  },
  {
    accessorKey: "payout",
    header: "Your Earnings",
    cell: ({ row }) => (
      <span className="font-bold text-green-600 dark:text-green-400">
        ₹{(row.original.payout / 100).toLocaleString('en-IN')}
      </span>
    ),
  },
];

// Helper: Get next Friday
function getNextPayoutDate(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
  const nextFriday = new Date(now.getTime() + daysUntilFriday * 24 * 60 * 60 * 1000);
  
  return nextFriday.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

