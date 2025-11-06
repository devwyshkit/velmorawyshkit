import { useState, useEffect } from "react";
import { Megaphone, CheckCircle, XCircle, Clock, Search, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/integrations/supabase-client";
import { Skeleton } from "@/components/ui/skeleton";

interface AdvertisingRequest {
  id: string;
  request_type: 'banner_promotion' | 'priority_listing';
  partner_id: string;
  store_id: string;
  store_name?: string;
  banner_image_url?: string;
  placement_zone?: string;
  banner_link_url?: string;
  boost_level?: number;
  duration_days?: number;
  start_date?: string;
  end_date?: string;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'expired';
  admin_notes?: string;
  pricing_paise?: number;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export const AdminAdvertisingManagement = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [bannerRequests, setBannerRequests] = useState<AdvertisingRequest[]>([]);
  const [priorityRequests, setPriorityRequests] = useState<AdvertisingRequest[]>([]);
  const [activeAds, setActiveAds] = useState<AdvertisingRequest[]>([]);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewingRequest, setReviewingRequest] = useState<AdvertisingRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [pricing, setPricing] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      // Load banner promotion requests
      const { data: bannerData, error: bannerError } = await supabase
        .from('advertising_requests')
        .select(`
          *,
          stores:store_id (
            name
          )
        `)
        .eq('request_type', 'banner_promotion')
        .order('created_at', { ascending: false });

      if (bannerError) throw bannerError;

      // Load priority listing requests
      const { data: priorityData, error: priorityError } = await supabase
        .from('advertising_requests')
        .select(`
          *,
          stores:store_id (
            name
          )
        `)
        .eq('request_type', 'priority_listing')
        .order('created_at', { ascending: false });

      if (priorityError) throw priorityError;

      // Load active ads
      const { data: activeData, error: activeError } = await supabase
        .from('advertising_requests')
        .select(`
          *,
          stores:store_id (
            name
          )
        `)
        .in('status', ['active', 'approved'])
        .order('created_at', { ascending: false });

      if (activeError) throw activeError;

      // Transform data
      const transform = (req: any): AdvertisingRequest => ({
        ...req,
        store_name: req.stores?.name || null,
      });

      setBannerRequests((bannerData || []).map(transform));
      setPriorityRequests((priorityData || []).map(transform));
      setActiveAds((activeData || []).map(transform));
    } catch (error: any) {
      toast({
        title: "Failed to load advertising requests",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (action: 'approve' | 'reject') => {
    if (!user || !reviewingRequest) return;

    setLoading(true);
    try {
      const updateData = {
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: adminNotes || null,
        pricing_paise: pricing ? parseInt(pricing) * 100 : null,
      };

      const { error } = await supabase
        .from('advertising_requests')
        .update(updateData)
        .eq('id', reviewingRequest.id);

      if (error) throw error;

      toast({
        title: action === 'approve' ? "Request approved" : "Request rejected",
        description: action === 'approve' 
          ? "The advertising request is now active"
          : "The partner has been notified",
      });

      setShowReviewDialog(false);
      setAdminNotes("");
      setPricing("");
      setReviewingRequest(null);
      loadRequests();
    } catch (error: any) {
      toast({
        title: "Failed to review request",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openReviewDialog = (request: AdvertisingRequest) => {
    setReviewingRequest(request);
    setAdminNotes(request.admin_notes || "");
    setPricing(request.pricing_paise ? (request.pricing_paise / 100).toString() : "");
    setShowReviewDialog(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'secondary', icon: Clock, text: 'Pending' },
      approved: { variant: 'default', icon: CheckCircle, text: 'Approved' },
      rejected: { variant: 'destructive', icon: XCircle, text: 'Rejected' },
      active: { variant: 'default', icon: CheckCircle, text: 'Active' },
      expired: { variant: 'secondary', icon: Clock, text: 'Expired' },
    };
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const filteredRequests = (requests: AdvertisingRequest[]) => {
    if (!searchQuery) return requests;
    const query = searchQuery.toLowerCase();
    return requests.filter(req => 
      req.store_name?.toLowerCase().includes(query) ||
      req.request_type.toLowerCase().includes(query)
    );
  };

  const RequestCard = ({ request }: { request: AdvertisingRequest }) => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-base">
                {request.request_type === 'banner_promotion' ? 'Banner Promotion' : 'Priority Listing'}
              </CardTitle>
              {getStatusBadge(request.status)}
            </div>
            {request.store_name && (
              <p className="text-sm text-muted-foreground">
                Store: <span className="font-medium">{request.store_name}</span>
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {request.request_type === 'banner_promotion' && (
          <div className="space-y-2">
            {request.banner_image_url && (
              <div className="relative w-full h-32 bg-muted rounded-lg overflow-hidden">
                <img 
                  src={request.banner_image_url} 
                  alt="Banner"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {request.placement_zone && (
              <div className="text-sm">
                <span className="text-muted-foreground">Placement:</span>
                <span className="font-medium ml-2 capitalize">{request.placement_zone.replace('_', ' ')}</span>
              </div>
            )}
            {request.banner_link_url && (
              <div className="text-sm">
                <span className="text-muted-foreground">Link:</span>
                <span className="font-medium ml-2 truncate">{request.banner_link_url}</span>
              </div>
            )}
          </div>
        )}
        {request.request_type === 'priority_listing' && (
          <div className="space-y-2 text-sm">
            {request.boost_level && (
              <div>
                <span className="text-muted-foreground">Boost Level:</span>
                <span className="font-medium ml-2">{request.boost_level}x</span>
              </div>
            )}
            {request.duration_days && (
              <div>
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium ml-2">{request.duration_days} days</span>
              </div>
            )}
          </div>
        )}
        {request.start_date && request.end_date && (
          <div className="text-sm mt-2">
            <span className="text-muted-foreground">Validity:</span>
            <span className="font-medium ml-2">
              {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
            </span>
          </div>
        )}
        {request.pricing_paise && (
          <div className="text-sm mt-2">
            <span className="text-muted-foreground">Pricing:</span>
            <span className="font-medium ml-2">₹{request.pricing_paise / 100}</span>
          </div>
        )}
        {request.status === 'pending' && (
          <div className="mt-4 flex gap-2">
            <Button
              onClick={() => openReviewDialog(request)}
              className="flex-1"
              variant="outline"
            >
              Review
            </Button>
          </div>
        )}
        {request.status === 'rejected' && request.admin_notes && (
          <div className="mt-4 p-3 bg-destructive/10 rounded-lg">
            <p className="text-sm font-medium text-destructive">Rejection Reason:</p>
            <p className="text-sm text-muted-foreground">{request.admin_notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">Advertising Management</h1>
        <p className="text-sm text-muted-foreground">
          Approve banner promotions and priority listing requests
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by store name or type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="banners" className="w-full">
        <TabsList>
          <TabsTrigger value="banners">
            Banner Promotions ({bannerRequests.filter(r => r.status === 'pending').length} pending)
          </TabsTrigger>
          <TabsTrigger value="priority">
            Priority Listings ({priorityRequests.filter(r => r.status === 'pending').length} pending)
          </TabsTrigger>
          <TabsTrigger value="active">
            Active Ads ({activeAds.length})
          </TabsTrigger>
        </TabsList>

        {/* Banner Promotions Tab */}
        <TabsContent value="banners" className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredRequests(bannerRequests).length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No banner promotion requests</h3>
                <p className="text-sm text-muted-foreground">
                  Partner banner promotion requests will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredRequests(bannerRequests).map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Priority Listings Tab */}
        <TabsContent value="priority" className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredRequests(priorityRequests).length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <h3 className="font-semibold mb-2">No priority listing requests</h3>
                <p className="text-sm text-muted-foreground">
                  Partner priority listing requests will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredRequests(priorityRequests).map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Active Ads Tab */}
        <TabsContent value="active" className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredRequests(activeAds).length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <h3 className="font-semibold mb-2">No active ads</h3>
                <p className="text-sm text-muted-foreground">
                  Currently running advertising campaigns will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredRequests(activeAds).map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Advertising Request</DialogTitle>
            <DialogDescription>
              {reviewingRequest?.request_type === 'banner_promotion' ? 'Banner Promotion' : 'Priority Listing'}
              {reviewingRequest?.store_name && ` - ${reviewingRequest.store_name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {reviewingRequest?.banner_image_url && (
              <div className="relative w-full h-32 bg-muted rounded-lg overflow-hidden">
                <img 
                  src={reviewingRequest.banner_image_url} 
                  alt="Banner"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="pricing">Pricing (₹)</Label>
              <Input
                id="pricing"
                type="number"
                value={pricing}
                onChange={(e) => setPricing(e.target.value)}
                placeholder="Set pricing for this request"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin_notes">Notes (optional)</Label>
              <Textarea
                id="admin_notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes for approval/rejection..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowReviewDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => handleReview('reject')}
                className="flex-1"
                disabled={loading}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                type="button"
                onClick={() => handleReview('approve')}
                className="flex-1"
                disabled={loading}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
