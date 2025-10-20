import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Clock, CheckCircle } from "lucide-react";

interface DisputeStatsProps {
  openDisputes: number;
  avgResolutionTime: number; // in hours
  resolutionRate: number; // percentage
}

/**
 * Dispute Statistics Cards
 * Shows key metrics for dispute resolution performance
 */
export const DisputeStats = ({
  openDisputes,
  avgResolutionTime,
  resolutionRate,
}: DisputeStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Open Disputes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{openDisputes}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Require attention
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Avg Resolution Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {avgResolutionTime < 24 ? `${avgResolutionTime}h` : `${Math.round(avgResolutionTime / 24)}d`}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Target: &lt;48 hours
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Resolution Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            {resolutionRate}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Target: &gt;95%
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

