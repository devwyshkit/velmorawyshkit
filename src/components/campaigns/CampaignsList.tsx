/**
 * Campaigns List
 * Feature 5: PROMPT 4
 */

import { Edit2, Pause, Play, Trash2, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/integrations/supabase-client";
import type { Campaign } from "@/types/campaigns";
import { format } from "date-fns";

interface CampaignsListProps {
  campaigns: Campaign[];
  onEdit: (campaign: Campaign) => void;
  onRefresh: () => void;
}

export const CampaignsList = ({ campaigns, onEdit, onRefresh }: CampaignsListProps) => {
  const { toast } = useToast();
  const { user } = useAuth();

  const getStatusBadge = (status: Campaign['status']) => {
    const variants: Record<Campaign['status'], { variant: any; label: string; }> = {
      active: { variant: 'default', label: '🟢 Active' },
      scheduled: { variant: 'secondary', label: '🟡 Scheduled' },
      ended: { variant: 'outline', label: '⚪ Ended' },
      draft: { variant: 'outline', label: 'Draft' },
    };
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handlePauseResume = async (campaignId: string, currentStatus: Campaign['status']) => {
    try {
      const newStatus = currentStatus === 'active' ? 'ended' : 'active';
      
      const { error } = await supabase
        .from('campaigns')
        .update({ status: newStatus })
        .eq('id', campaignId);

      if (error) throw error;

      toast({
        title: newStatus === 'active' ? "Campaign resumed" : "Campaign paused",
        description: `Campaign is now ${newStatus}`,
      });

      onRefresh();
    } catch (error: any) {
      toast({
        title: "Action failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;

      toast({
        title: "Campaign deleted",
        description: "Campaign removed successfully",
      });

      onRefresh();
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {campaigns.map(campaign => (
        <Card key={campaign.id}>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{campaign.name}</h3>
                    {getStatusBadge(campaign.status)}
                    {campaign.featured && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        Featured
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <span>
                      {campaign.type === 'discount' && campaign.discount_type && campaign.discount_value && (
                        <>
                          {campaign.discount_type === 'percentage' 
                            ? `${campaign.discount_value}% off`
                            : `₹${campaign.discount_value} off`
                          }
                        </>
                      )}
                      {campaign.type === 'free_addon' && 'Free Add-on'}
                      {campaign.type === 'bundle' && 'Bundle Deal'}
                    </span>
                    <span>•</span>
                    <span>{campaign.products.length} products</span>
                    <span>•</span>
                    <span>
                      {format(new Date(campaign.start_date), 'MMM d')} - {format(new Date(campaign.end_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onEdit(campaign)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  {campaign.status !== 'ended' && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePauseResume(campaign.id, campaign.status)}
                    >
                      {campaign.status === 'active' ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(campaign.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Impressions</p>
                  <p className="text-lg font-semibold">{campaign.impressions.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Orders</p>
                  <p className="text-lg font-semibold">{campaign.orders}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                  <p className="text-lg font-semibold">₹{(campaign.revenue / 100).toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* Featured Campaign Fee Info */}
              {campaign.featured && campaign.revenue > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                  <p className="text-yellow-800">
                    <strong>Featured Fee:</strong> ₹{((campaign.revenue * 0.05) / 100).toLocaleString('en-IN')} 
                    (5% of revenue)
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Create/Edit Sheet */}
      {showCreateDialog && (
        <CreateCampaign
          campaign={editingCampaign}
          onClose={() => {
            setShowCreateDialog(false);
            setEditingCampaign(null);
          }}
          onSuccess={() => {
            setShowCreateDialog(false);
            setEditingCampaign(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
};

