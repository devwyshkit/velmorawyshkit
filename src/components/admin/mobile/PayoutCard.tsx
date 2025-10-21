/**
 * Payout Card (Mobile View)
 * Card view for payouts on mobile instead of DataTable
 */

import { Clock, CheckCircle2, FileText, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface Payout {
  id: string;
  partner_name: string;
  period_start: string;
  period_end: string;
  earnings: number;
  commission: number;
  net_payout: number;
  status: 'pending' | 'scheduled' | 'processing' | 'completed' | 'failed';
  zoho_invoice_number?: string;
  processed_at?: string;
}

interface PayoutCardProps {
  payout: Payout;
  onSelect?: (id: string, selected: boolean) => void;
  selected?: boolean;
}

export const PayoutCard = ({ payout, onSelect, selected }: PayoutCardProps) => {
  const getStatusConfig = (status: Payout['status']) => {
    const configs = {
      pending: { icon: Clock, variant: 'secondary' as const, label: 'Pending' },
      scheduled: { icon: FileText, variant: 'default' as const, label: 'Scheduled' },
      processing: { icon: Clock, variant: 'default' as const, label: 'Processing' },
      completed: { icon: CheckCircle2, variant: 'default' as const, label: 'Completed' },
      failed: { icon: AlertCircle, variant: 'destructive' as const, label: 'Failed' },
    };
    return configs[status];
  };

  const statusConfig = getStatusConfig(payout.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="relative">
      <CardContent className="p-4">
        {/* Selection Checkbox (if onSelect provided) */}
        {onSelect && (
          <div className="absolute top-3 right-3">
            <input
            placeholder="select"
              type="checkbox"
              checked={selected}
              onChange={(e) => onSelect(payout.id, e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 cursor-pointer"
            />
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-base">{payout.partner_name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(new Date(payout.period_start), 'MMM dd')} - {format(new Date(payout.period_end), 'MMM dd, yyyy')}
            </p>
          </div>
          <Badge variant={statusConfig.variant} className="gap-1 flex-shrink-0">
            <StatusIcon className="h-3 w-3" />
            {statusConfig.label}
          </Badge>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
          <div>
            <span className="text-muted-foreground text-xs">Earnings</span>
            <p className="font-medium">₹{(payout.earnings / 100).toLocaleString('en-IN')}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Commission</span>
            <p className="font-medium text-muted-foreground">₹{(payout.commission / 100).toLocaleString('en-IN')}</p>
          </div>
          <div className="col-span-2">
            <span className="text-muted-foreground text-xs">Net Payout</span>
            <p className="font-semibold text-lg text-primary">₹{(payout.net_payout / 100).toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Invoice Info */}
        {payout.zoho_invoice_number && (
          <div className="flex items-center justify-between text-xs border-t pt-2">
            <span className="text-muted-foreground">Invoice: {payout.zoho_invoice_number}</span>
            <Badge variant="secondary" className="text-xs gap-1">
              ⚡ Zoho Books
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

