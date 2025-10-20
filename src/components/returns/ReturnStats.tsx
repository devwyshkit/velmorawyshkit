import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PackageX, TrendingDown, Clock } from "lucide-react";

interface ReturnStatsProps {
  pendingReturns: number;
  returnRate: number; // percentage
  avgProcessingTime: number; // in days
}

/**
 * Return Statistics Cards
 * Shows key metrics for returns management
 */
export const ReturnStats = ({
  pendingReturns,
  returnRate,
  avgProcessingTime,
}: ReturnStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <PackageX className="h-4 w-4" />
            Pending Returns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{pendingReturns}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Awaiting action
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Return Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${returnRate < 10 ? 'text-green-600' : 'text-amber-600'}`}>
            {returnRate}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Target: &lt;10%
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Avg Processing Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {avgProcessingTime}d
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            From approval to refund
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

