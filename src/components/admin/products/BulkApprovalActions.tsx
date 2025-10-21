/**
 * Bulk Approval Actions Component
 * Quick actions for bulk approving/rejecting products
 */

import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BulkApprovalActionsProps {
  selectedCount: number;
  onBulkApprove: () => void;
  onBulkReject: () => void;
  processing: boolean;
}

export const BulkApprovalActions = ({
  selectedCount,
  onBulkApprove,
  onBulkReject,
  processing,
}: BulkApprovalActionsProps) => {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <p className="text-sm font-medium">
        {selectedCount} product{selectedCount !== 1 ? 's' : ''} selected
      </p>
      <div className="flex gap-2">
        <Button
          onClick={onBulkApprove}
          disabled={processing}
          className="gap-2 bg-green-600 hover:bg-green-700"
        >
          <CheckCircle2 className="h-4 w-4" />
          Approve All
        </Button>
        <Button
          onClick={onBulkReject}
          disabled={processing}
          variant="destructive"
          className="gap-2"
        >
          <XCircle className="h-4 w-4" />
          Reject All
        </Button>
      </div>
    </div>
  );
};

