import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Truck, Package } from "lucide-react";
import { supabase } from "@/lib/integrations/supabase-client";

interface PorterDelhiveryTrackingProps {
  orderId: string;
  logisticsProvider: 'porter' | 'delhivery' | null;
  trackingNumber: string | null;
}

interface TrackingStatus {
  status: string;
  location?: string;
  estimatedDelivery?: string;
  lastUpdated?: string;
}

export const PorterDelhiveryTracking = ({
  orderId,
  logisticsProvider,
  trackingNumber,
}: PorterDelhiveryTrackingProps) => {
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch tracking status from Porter/Delhivery APIs
  useEffect(() => {
    const fetchTrackingStatus = async () => {
      if (!logisticsProvider || !trackingNumber) return;

      setLoading(true);
      try {
        // Call Edge Function to fetch tracking status from Porter/Delhivery
        const { data, error } = await supabase.functions.invoke('sync-logistics-tracking', {
          body: {
            orderId,
            logisticsProvider,
            trackingNumber,
          },
        });

        if (data && !error) {
          setTrackingStatus(data);
        }
      } catch (error) {
        // Silent error handling - tracking unavailable (Swiggy 2025 pattern)
      } finally {
        setLoading(false);
      }
    };

    fetchTrackingStatus();

    // Poll for updates every 2 minutes when order is out for delivery
    const interval = setInterval(() => {
      fetchTrackingStatus();
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [orderId, logisticsProvider, trackingNumber]);

  if (!logisticsProvider || !trackingNumber) {
    return null;
  }

  const getTrackingUrl = () => {
    if (logisticsProvider === 'porter') {
      return `https://porter.in/track/${trackingNumber}`;
    } else if (logisticsProvider === 'delhivery') {
      return `https://www.delhivery.com/track/${trackingNumber}`;
    }
    return null;
  };

  const getProviderName = () => {
    return logisticsProvider === 'porter' ? 'Porter' : 'Delhivery';
  };

  const getProviderColor = () => {
    return logisticsProvider === 'porter' ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200';
  };

  return (
    <Card className={getProviderColor()}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold text-sm">Tracked via {getProviderName()}</h3>
              <p className="text-xs text-muted-foreground">Tracking ID: {trackingNumber}</p>
            </div>
          </div>
        </div>

        {trackingStatus && (
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-medium">{trackingStatus.status}</span>
            </div>
            {trackingStatus.location && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Location:</span>
                <span className="font-medium">{trackingStatus.location}</span>
              </div>
            )}
            {trackingStatus.estimatedDelivery && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">ETA:</span>
                <span className="font-medium">{trackingStatus.estimatedDelivery}</span>
              </div>
            )}
          </div>
        )}

        {loading && (
          <p className="text-xs text-muted-foreground mb-3">Fetching latest status...</p>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {
            const url = getTrackingUrl();
            if (url) {
              window.open(url, '_blank');
            }
          }}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Track on {getProviderName()}
        </Button>
      </CardContent>
    </Card>
  );
};



