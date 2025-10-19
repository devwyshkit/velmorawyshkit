import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LucideIcon, Clock, CheckCircle, XCircle, AlertCircle, Pause } from "lucide-react";

type Status = 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'active' 
  | 'inactive'
  | 'completed'
  | 'processing'
  | 'failed'
  | 'suspended';

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusConfig: Record<Status, { label: string; icon: LucideIcon; variant: string; color: string }> = {
  pending: {
    label: 'Pending',
    icon: Clock,
    variant: 'secondary',
    color: 'text-yellow-600 dark:text-yellow-400',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle,
    variant: 'default',
    color: 'text-green-600 dark:text-green-400',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    variant: 'destructive',
    color: 'text-red-600 dark:text-red-400',
  },
  active: {
    label: 'Active',
    icon: CheckCircle,
    variant: 'default',
    color: 'text-green-600 dark:text-green-400',
  },
  inactive: {
    label: 'Inactive',
    icon: Pause,
    variant: 'secondary',
    color: 'text-gray-600 dark:text-gray-400',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    variant: 'default',
    color: 'text-green-600 dark:text-green-400',
  },
  processing: {
    label: 'Processing',
    icon: AlertCircle,
    variant: 'secondary',
    color: 'text-blue-600 dark:text-blue-400',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    variant: 'destructive',
    color: 'text-red-600 dark:text-red-400',
  },
  suspended: {
    label: 'Suspended',
    icon: Pause,
    variant: 'destructive',
    color: 'text-orange-600 dark:text-orange-400',
  },
};

/**
 * Reusable status badge component with icons
 * Follows Swiggy/Zomato status indicator pattern
 * 
 * Usage:
 * <StatusBadge status="pending" />
 * <StatusBadge status="approved" />
 */
export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant as any}
      className={cn("gap-1 text-xs", className)}
    >
      <Icon className={cn("h-3 w-3", config.color)} />
      <span>{config.label}</span>
    </Badge>
  );
};

