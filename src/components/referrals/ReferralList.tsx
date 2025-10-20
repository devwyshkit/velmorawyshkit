/**
 * Referral List Component
 * Feature 7: PROMPT 7 - Referral Program
 * DataTable showing all referrals with status and progress
 * Mobile-first design (320px base)
 */

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/integrations/supabase-client";

interface Referral {
  id: string;
  referee_id: string;
  referee_name?: string;
  referee_email?: string;
  code: string;
  status: 'pending' | 'in_progress' | 'complete' | 'rejected';
  orders_completed: number;
  reward_amount: number;
  completed_at?: string;
  created_at: string;
}

interface ReferralListProps {
  referrals: Referral[];
  onUpdate?: () => void;
}

/**
 * Referral List DataTable
 * Shows all referrals with progress tracking
 */
export const ReferralList = ({ referrals, onUpdate }: ReferralListProps) => {
  const { toast } = useToast();
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);

  const getStatusBadge = (referral: Referral) => {
    const config = {
      pending: {
        variant: 'secondary' as const,
        label: '⏳ KYC Pending',
      },
      in_progress: {
        variant: 'default' as const,
        label: '🟡 In Progress',
      },
      complete: {
        variant: 'secondary' as const,
        label: '🟢 Complete',
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
      },
      rejected: {
        variant: 'destructive' as const,
        label: '❌ Rejected',
      },
    };

    const statusConfig = config[referral.status];
    
    return (
      <Badge variant={statusConfig.variant} className={statusConfig.className}>
        {statusConfig.label}
      </Badge>
    );
  };

  const handleSendReminder = async (referral: Referral) => {
    setSendingReminder(referral.id);
    
    try {
      // TODO: Implement actual reminder notification
      // For now, just show toast
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: "Reminder sent!",
        description: `Reminder sent to ${referral.referee_name || referral.referee_email}`,
      });
    } catch (error) {
      toast({
        title: "Failed to send reminder",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setSendingReminder(null);
    }
  };

  if (referrals.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No referrals yet. Share your code to get started!</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Partner</TableHead>
            <TableHead className="hidden sm:table-cell">Status</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Reward</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {referrals.map((referral) => (
            <TableRow key={referral.id}>
              <TableCell>
                <div className="space-y-0.5">
                  <p className="font-medium text-sm">
                    {referral.referee_name || 'New Partner'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {referral.referee_email || 'Pending signup'}
                  </p>
                </div>
              </TableCell>

              <TableCell className="hidden sm:table-cell">
                {getStatusBadge(referral)}
              </TableCell>

              <TableCell>
                <div className="space-y-1 min-w-[120px]">
                  <p className="text-xs font-medium">
                    {referral.orders_completed}/5 orders
                  </p>
                  <Progress 
                    value={(referral.orders_completed / 5) * 100} 
                    className="h-1.5"
                  />
                </div>
              </TableCell>

              <TableCell>
                {referral.status === 'complete' ? (
                  <p className="text-sm font-semibold text-green-600">
                    ₹{referral.reward_amount}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Pending</p>
                )}
              </TableCell>

              <TableCell className="text-right">
                {referral.status === 'in_progress' && referral.orders_completed < 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSendReminder(referral)}
                    disabled={sendingReminder === referral.id}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    {sendingReminder === referral.id ? 'Sending...' : 'Remind'}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

