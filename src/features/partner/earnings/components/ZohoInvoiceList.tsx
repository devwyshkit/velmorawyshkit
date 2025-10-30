/**
 * Zoho Invoice List - Partner Earnings
 * Monthly invoice display with Zoho Books integration
 * Mobile-first design with status tracking
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  Eye, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  DollarSign,
  Calendar,
  FileText,
  ExternalLink,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface ZohoInvoice {
  id: string;
  invoiceNumber: string;
  month: string;
  year: number;
  totalAmount: number;
  commissionAmount: number;
  status: 'paid' | 'pending' | 'overdue' | 'draft';
  dueDate: string;
  paidDate?: string;
  zohoInvoiceId: string;
  gstAmount: number;
  netAmount: number;
  orderCount: number;
  gmv: number;
  createdAt: string;
  updatedAt: string;
}

// Mock data for demonstration
const mockInvoices: ZohoInvoice[] = [
  // Zoho removed — mock data retained for UI demo only (no external links)
  {
    id: '2',
    invoiceNumber: 'WYS-SEP2025-001',
    month: 'September',
    year: 2025,
    totalAmount: 38000,
    commissionAmount: 38000,
    status: 'paid',
    dueDate: '2025-10-07',
    paidDate: '2025-10-03',
    zohoInvoiceId: 'INVOICE-12344',
    gstAmount: 6840,
    netAmount: 31160,
    orderCount: 19,
    gmv: 210000,
    createdAt: '2025-09-30T00:00:00Z',
    updatedAt: '2025-10-03T14:20:00Z'
  },
  {
    id: '3',
    invoiceNumber: 'WYS-AUG2025-001',
    month: 'August',
    year: 2025,
    totalAmount: 32000,
    commissionAmount: 32000,
    status: 'paid',
    dueDate: '2025-09-07',
    paidDate: '2025-09-01',
    zohoInvoiceId: 'INVOICE-12343',
    gstAmount: 5760,
    netAmount: 26240,
    orderCount: 16,
    gmv: 180000,
    createdAt: '2025-08-31T00:00:00Z',
    updatedAt: '2025-09-01T09:15:00Z'
  },
  {
    id: '4',
    invoiceNumber: 'WYS-JUL2025-001',
    month: 'July',
    year: 2025,
    totalAmount: 28000,
    commissionAmount: 28000,
    status: 'paid',
    dueDate: '2025-08-07',
    paidDate: '2025-08-02',
    zohoInvoiceId: 'INVOICE-12342',
    gstAmount: 5040,
    netAmount: 22960,
    orderCount: 14,
    gmv: 155000,
    createdAt: '2025-07-31T00:00:00Z',
    updatedAt: '2025-08-02T11:45:00Z'
  }
];

interface ZohoInvoiceListProps {
  className?: string;
}

export const ZohoInvoiceList: React.FC<ZohoInvoiceListProps> = ({
  className
}) => {
  const [invoices, setInvoices] = useState<ZohoInvoice[]>(mockInvoices);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<ZohoInvoice | null>(null);

  const formatPrice = (amount: number) => {
    return amount.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'overdue':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Overdue
          </Badge>
        );
      case 'draft':
        return (
          <Badge variant="outline">
            <FileText className="h-3 w-3 mr-1" />
            Draft
          </Badge>
        );
      default:
        return null;
    }
  };

  const getFilteredInvoices = () => {
    switch (activeTab) {
      case 'paid':
        return invoices.filter(invoice => invoice.status === 'paid');
      case 'pending':
        return invoices.filter(invoice => invoice.status === 'pending');
      case 'overdue':
        return invoices.filter(invoice => invoice.status === 'overdue');
      default:
        return invoices;
    }
  };

  const getTotalStats = () => {
    const paidInvoices = invoices.filter(inv => inv.status === 'paid');
    const pendingInvoices = invoices.filter(inv => inv.status === 'pending');
    
    return {
      totalPaid: paidInvoices.reduce((sum, inv) => sum + inv.netAmount, 0),
      totalPending: pendingInvoices.reduce((sum, inv) => sum + inv.netAmount, 0),
      totalCommission: invoices.reduce((sum, inv) => sum + inv.commissionAmount, 0),
      totalGST: invoices.reduce((sum, inv) => sum + inv.gstAmount, 0)
    };
  };

  const stats = getTotalStats();

  const openZohoInvoice = (invoice: ZohoInvoice) => {
    // Open Zoho Books invoice in new tab
    window.open(`https://books.zoho.in/app#/invoices/${invoice.zohoInvoiceId}`, '_blank');
  };

  const downloadInvoice = (invoice: ZohoInvoice) => {
    // Trigger Zoho Books PDF download
    window.open(`https://books.zoho.in/app#/invoices/${invoice.zohoInvoiceId}/pdf`, '_blank');
  };

  const renderInvoiceCard = (invoice: ZohoInvoice) => (
    <Card key={invoice.id} className="hover:shadow-md transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-lg">{invoice.invoiceNumber}</h3>
            <p className="text-sm text-muted-foreground">
              {invoice.month} {invoice.year}
            </p>
          </div>
          {getStatusBadge(invoice.status)}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Commission</p>
            <p className="font-semibold">{formatPrice(invoice.commissionAmount)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">GST (18%)</p>
            <p className="font-semibold">{formatPrice(invoice.gstAmount)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Net Amount</p>
            <p className="font-semibold text-green-600">{formatPrice(invoice.netAmount)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Orders</p>
            <p className="font-semibold">{invoice.orderCount}</p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">GMV</span>
            <span className="font-medium">{formatPrice(invoice.gmv)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Due Date</span>
            <span className="font-medium">
              {new Date(invoice.dueDate).toLocaleDateString()}
            </span>
          </div>
          {invoice.paidDate && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Paid Date</span>
              <span className="font-medium text-green-600">
                {new Date(invoice.paidDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedInvoice(invoice)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openZohoInvoice(invoice)}
            className="flex-1"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in Zoho
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadInvoice(invoice)}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <FileText className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Monthly Commission Invoices</h1>
          <p className="text-muted-foreground">
            Professional invoices generated via Zoho Books
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatPrice(stats.totalPaid)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatPrice(stats.totalPending)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Commission</p>
                <p className="text-2xl font-bold">{formatPrice(stats.totalCommission)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">GST Paid</p>
                <p className="text-2xl font-bold">{formatPrice(stats.totalGST)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Invoices</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {getFilteredInvoices().length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No invoices found</h3>
              <p className="text-muted-foreground">
                {activeTab === 'all' 
                  ? 'No invoices have been generated yet'
                  : `No ${activeTab} invoices found`
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getFilteredInvoices().map(renderInvoiceCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <Card className="fixed inset-4 z-50 overflow-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedInvoice.invoiceNumber}</CardTitle>
                <CardDescription>
                  {selectedInvoice.month} {selectedInvoice.year} Commission Invoice
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => setSelectedInvoice(null)}
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Invoice Number</p>
                <p className="font-medium">{selectedInvoice.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Zoho Invoice ID</p>
                <p className="font-medium">{selectedInvoice.zohoInvoiceId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-1">{getStatusBadge(selectedInvoice.status)}</div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="font-medium">
                  {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-semibold">Financial Breakdown</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Commission Amount</span>
                  <span className="font-medium">{formatPrice(selectedInvoice.commissionAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (18%)</span>
                  <span className="font-medium">{formatPrice(selectedInvoice.gstAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Amount</span>
                  <span className="font-medium">{formatPrice(selectedInvoice.totalAmount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Net Amount (After GST)</span>
                  <span className="text-green-600">{formatPrice(selectedInvoice.netAmount)}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-semibold">Performance Metrics</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="font-semibold text-lg">{selectedInvoice.orderCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">GMV</p>
                  <p className="font-semibold text-lg">{formatPrice(selectedInvoice.gmv)}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => openZohoInvoice(selectedInvoice)}
                className="flex-1"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in Zoho Books
              </Button>
              <Button
                variant="outline"
                onClick={() => downloadInvoice(selectedInvoice)}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ZohoInvoiceList;
