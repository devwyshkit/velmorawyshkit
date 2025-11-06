import { useState, useEffect } from "react";
import { Tag, Plus, Edit2, Trash2, Clock, CheckCircle, XCircle, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/integrations/supabase-client";
import { Skeleton } from "@/components/ui/skeleton";

interface PromotionalOffer {
  id: string;
  created_by_type: 'admin' | 'partner';
  created_by_id: string;
  store_id?: string;
  store_name?: string;
  title: string;
  description?: string;
  discount_type: 'percentage' | 'fixed' | 'free_delivery';
  discount_value: number;
  min_order_value_paise: number;
  max_discount_paise?: number;
  applicable_to: 'all_stores' | 'specific_stores' | 'specific_categories' | 'specific_products';
  start_date: string;
  end_date: string;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'expired' | 'cancelled';
  admin_notes?: string;
  usage_limit?: number;
  usage_count: number;
  created_at: string;
}

export const AdminPromotionalOffers = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [platformOffers, setPlatformOffers] = useState<PromotionalOffer[]>([]);
  const [partnerRequests, setPartnerRequests] = useState<PromotionalOffer[]>([]);
  const [activeOffers, setActiveOffers] = useState<PromotionalOffer[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [editingOffer, setEditingOffer] = useState<PromotionalOffer | null>(null);
  const [reviewingOffer, setReviewingOffer] = useState<PromotionalOffer | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | 'free_delivery'>('percentage');
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [applicableTo, setApplicableTo] = useState<'all_stores' | 'specific_stores'>('all_stores');
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    setLoading(true);
    try {
      // Load platform offers (admin-created)
      let platformData = null;
      let requestsData = null;
      let activeData = null;

      try {
        const { data, error: platformError } = await supabase
          .from('promotional_offers')
          .select(`
            *,
            stores:store_id (
              name
            )
          `)
          .eq('created_by_type', 'admin')
          .order('created_at', { ascending: false });

        if (platformError) {
          if (platformError.code === 'PGRST116') {
            console.warn('Promotional offers table not available');
            setPlatformOffers([]);
            setPartnerRequests([]);
            setActiveOffers([]);
            return;
          }
          throw platformError;
        }
        platformData = data;
      } catch (error: any) {
        if (error?.code === 'PGRST116' || error?.message?.includes('does not exist')) {
          console.warn('Promotional offers table not available');
          setPlatformOffers([]);
          setPartnerRequests([]);
          setActiveOffers([]);
          return;
        }
        throw error;
      }

      try {
        // Load partner requests (pending approval)
        const { data, error: requestsError } = await supabase
          .from('promotional_offers')
          .select(`
            *,
            stores:store_id (
              name
            )
          `)
          .eq('created_by_type', 'partner')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (requestsError) {
          if (requestsError.code === 'PGRST116') {
            requestsData = [];
          } else {
            throw requestsError;
          }
        } else {
          requestsData = data;
        }
      } catch (error: any) {
        if (error?.code === 'PGRST116') {
          requestsData = [];
        } else {
          console.error('Error loading partner requests:', error);
          requestsData = [];
        }
      }

      try {
        // Load active offers
        const { data, error: activeError } = await supabase
          .from('promotional_offers')
          .select(`
            *,
            stores:store_id (
              name
            )
          `)
        .in('status', ['active', 'approved'])
        .order('created_at', { ascending: false });

        if (activeError) {
          if (activeError.code === 'PGRST116') {
            activeData = [];
          } else {
            throw activeError;
          }
        } else {
          activeData = data;
        }
      } catch (error: any) {
        if (error?.code === 'PGRST116') {
          activeData = [];
        } else {
          console.error('Error loading active offers:', error);
          activeData = [];
        }
      }

      // Transform data
      const transformOffer = (offer: any): PromotionalOffer => ({
        ...offer,
        store_name: offer.stores?.name || null,
      });

      // Set state with transformed data
      setPlatformOffers((platformData || []).map(transformOffer));
      setPartnerRequests((requestsData || []).map(transformOffer));
      setActiveOffers((activeData || []).map(transformOffer));
    } catch (error: any) {
      toast({
        title: "Failed to load offers",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlatformOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const offerData = {
        created_by_type: 'admin',
        created_by_id: user.id,
        store_id: null,
        title,
        description: description || null,
        discount_type: discountType,
        discount_value: discountType === 'free_delivery' ? 0 : parseInt(discountValue),
        min_order_value_paise: parseInt(minOrderValue) * 100 || 0,
        max_discount_paise: maxDiscount ? parseInt(maxDiscount) * 100 : null,
        applicable_to: applicableTo,
        applicable_store_ids: applicableTo === 'specific_stores' ? [] : null,
        applicable_category_ids: null,
        applicable_product_ids: null,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        status: 'approved', // Admin-created offers are auto-approved
        usage_limit: usageLimit ? parseInt(usageLimit) : null,
      };

      try {
        if (editingOffer) {
          const { error } = await supabase
            .from('promotional_offers')
            .update(offerData)
            .eq('id', editingOffer.id);
          
          if (error) {
            if (error.code === 'PGRST116') {
              toast({ 
                title: "Feature not available", 
                description: "Promotional offers table not available",
                variant: "destructive"
              });
              return;
            }
            throw error;
          }
          toast({ title: "Offer updated successfully" });
        } else {
          const { error } = await supabase
            .from('promotional_offers')
            .insert(offerData);
          
          if (error) {
            if (error.code === 'PGRST116') {
              toast({ 
                title: "Feature not available", 
                description: "Promotional offers table not available",
                variant: "destructive"
              });
              return;
            }
            throw error;
          }
          toast({ title: "Platform offer created successfully" });
        }
      } catch (error: any) {
        if (error?.code === 'PGRST116' || error?.message?.includes('does not exist')) {
          toast({ 
            title: "Feature not available", 
            description: "Promotional offers table not available",
            variant: "destructive"
          });
          return;
        }
        throw error;
      }

      setShowCreateDialog(false);
      resetForm();
      loadOffers();
    } catch (error: any) {
      toast({
        title: "Failed to save offer",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReviewOffer = async (action: 'approve' | 'reject') => {
    if (!user || !reviewingOffer) return;

    setLoading(true);
    try {
      const updateData = {
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: adminNotes || null,
      };

      try {
        const { error } = await supabase
          .from('promotional_offers')
          .update(updateData)
          .eq('id', reviewingOffer.id);

        if (error) {
          if (error.code === 'PGRST116') {
            toast({ 
              title: "Feature not available", 
              description: "Promotional offers table not available",
              variant: "destructive"
            });
            return;
          }
          throw error;
        }
      } catch (error: any) {
        if (error?.code === 'PGRST116' || error?.message?.includes('does not exist')) {
          toast({ 
            title: "Feature not available", 
            description: "Promotional offers table not available",
            variant: "destructive"
          });
          return;
        }
        throw error;
      }

      toast({
        title: action === 'approve' ? "Offer approved" : "Offer rejected",
        description: action === 'approve' 
          ? "The offer is now active"
          : "The partner has been notified",
      });

      setShowReviewDialog(false);
      setAdminNotes("");
      setReviewingOffer(null);
      loadOffers();
    } catch (error: any) {
      toast({
        title: "Failed to review offer",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (offer: PromotionalOffer) => {
    if (!confirm(`Delete offer "${offer.title}"?`)) return;

    try {
      const { error } = await supabase
        .from('promotional_offers')
        .delete()
        .eq('id', offer.id);

      if (error) {
        if (error.code === 'PGRST116') {
          toast({ 
            title: "Feature not available", 
            description: "Promotional offers table not available",
            variant: "destructive"
          });
          return;
        }
        throw error;
      }
      toast({ title: "Offer deleted" });
      loadOffers();
    } catch (error: any) {
      toast({
        title: "Failed to delete",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDiscountType('percentage');
    setDiscountValue("");
    setMinOrderValue("");
    setMaxDiscount("");
    setApplicableTo('all_stores');
    setStartDate("");
    setEndDate("");
    setUsageLimit("");
    setEditingOffer(null);
  };

  const handleEdit = (offer: PromotionalOffer) => {
    if (offer.created_by_type !== 'admin') {
      toast({
        title: "Cannot edit",
        description: "Only platform offers can be edited",
        variant: "destructive",
      });
      return;
    }
    setEditingOffer(offer);
    setTitle(offer.title);
    setDescription(offer.description || "");
    setDiscountType(offer.discount_type);
    setDiscountValue(offer.discount_value.toString());
    setMinOrderValue((offer.min_order_value_paise / 100).toString());
    setMaxDiscount(offer.max_discount_paise ? (offer.max_discount_paise / 100).toString() : "");
    setApplicableTo(offer.applicable_to);
    setStartDate(offer.start_date.split('T')[0]);
    setEndDate(offer.end_date.split('T')[0]);
    setUsageLimit(offer.usage_limit?.toString() || "");
    setShowCreateDialog(true);
  };

  const handleReview = (offer: PromotionalOffer) => {
    setReviewingOffer(offer);
    setAdminNotes(offer.admin_notes || "");
    setShowReviewDialog(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'secondary', icon: Clock, text: 'Pending' },
      approved: { variant: 'default', icon: CheckCircle, text: 'Approved' },
      rejected: { variant: 'destructive', icon: XCircle, text: 'Rejected' },
      active: { variant: 'default', icon: CheckCircle, text: 'Active' },
      expired: { variant: 'secondary', icon: Clock, text: 'Expired' },
      cancelled: { variant: 'secondary', icon: XCircle, text: 'Cancelled' },
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

  const formatDiscount = (offer: PromotionalOffer) => {
    if (offer.discount_type === 'percentage') {
      return `${offer.discount_value}%${offer.max_discount_paise ? ` (max ₹${offer.max_discount_paise / 100})` : ''}`;
    }
    if (offer.discount_type === 'fixed') {
      return `₹${offer.discount_value / 100}`;
    }
    return 'Free Delivery';
  };

  const filteredOffers = (offers: PromotionalOffer[]) => {
    if (!searchQuery) return offers;
    const query = searchQuery.toLowerCase();
    return offers.filter(offer => 
      offer.title.toLowerCase().includes(query) ||
      offer.description?.toLowerCase().includes(query) ||
      offer.store_name?.toLowerCase().includes(query)
    );
  };

  const OfferCard = ({ offer }: { offer: PromotionalOffer }) => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-base">{offer.title}</CardTitle>
              {getStatusBadge(offer.status)}
            </div>
            {offer.description && (
              <p className="text-sm text-muted-foreground">{offer.description}</p>
            )}
            {offer.store_name && (
              <p className="text-sm text-muted-foreground mt-1">
                Store: <span className="font-medium">{offer.store_name}</span>
              </p>
            )}
          </div>
          {offer.created_by_type === 'admin' && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(offer)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(offer)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Discount:</span>
            <p className="font-semibold">{formatDiscount(offer)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Validity:</span>
            <p className="font-semibold">
              {new Date(offer.start_date).toLocaleDateString()} - {new Date(offer.end_date).toLocaleDateString()}
            </p>
          </div>
          {offer.min_order_value_paise > 0 && (
            <div>
              <span className="text-muted-foreground">Min Order:</span>
              <p className="font-semibold">₹{offer.min_order_value_paise / 100}</p>
            </div>
          )}
          {offer.usage_limit && (
            <div>
              <span className="text-muted-foreground">Usage:</span>
              <p className="font-semibold">{offer.usage_count} / {offer.usage_limit}</p>
            </div>
          )}
        </div>
        {offer.status === 'rejected' && offer.admin_notes && (
          <div className="mt-4 p-3 bg-destructive/10 rounded-lg">
            <p className="text-sm font-medium text-destructive">Rejection Reason:</p>
            <p className="text-sm text-muted-foreground">{offer.admin_notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Promotional Offers</h1>
          <p className="text-sm text-muted-foreground">
            Manage platform offers and approve partner requests
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Platform Offer
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search offers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="platform" className="w-full">
        <TabsList>
          <TabsTrigger value="platform">
            Platform Offers ({platformOffers.length})
          </TabsTrigger>
          <TabsTrigger value="requests">
            Partner Requests ({partnerRequests.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active Offers ({activeOffers.length})
          </TabsTrigger>
        </TabsList>

        {/* Platform Offers Tab */}
        <TabsContent value="platform" className="space-y-4">
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
          ) : filteredOffers(platformOffers).length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No platform offers</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create platform-wide promotional campaigns
                </p>
                <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Offer
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredOffers(platformOffers).map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Partner Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
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
          ) : filteredOffers(partnerRequests).length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <h3 className="font-semibold mb-2">No pending requests</h3>
                <p className="text-sm text-muted-foreground">
                  Partner promotional offers will appear here for review
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredOffers(partnerRequests).map((offer) => (
                <Card key={offer.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-base">{offer.title}</CardTitle>
                          {getStatusBadge(offer.status)}
                        </div>
                        {offer.description && (
                          <p className="text-sm text-muted-foreground">{offer.description}</p>
                        )}
                        {offer.store_name && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Store: <span className="font-medium">{offer.store_name}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-muted-foreground">Discount:</span>
                        <p className="font-semibold">{formatDiscount(offer)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Validity:</span>
                        <p className="font-semibold">
                          {new Date(offer.start_date).toLocaleDateString()} - {new Date(offer.end_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleReview(offer)}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Review
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Active Offers Tab */}
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
          ) : filteredOffers(activeOffers).length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <h3 className="font-semibold mb-2">No active offers</h3>
                <p className="text-sm text-muted-foreground">
                  Currently running promotional offers will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredOffers(activeOffers).map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOffer ? 'Edit Platform Offer' : 'Create Platform Offer'}</DialogTitle>
            <DialogDescription>
              Create a platform-wide promotional campaign
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreatePlatformOffer} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Festival Sale - 20% Off"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Offer details..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount_type">Discount Type *</Label>
                <Select value={discountType} onValueChange={(v: any) => setDiscountType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                    <SelectItem value="free_delivery">Free Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount_value">
                  {discountType === 'percentage' ? 'Percentage (%) *' : discountType === 'fixed' ? 'Amount (₹) *' : 'N/A'}
                </Label>
                {discountType !== 'free_delivery' && (
                  <Input
                    id="discount_value"
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'percentage' ? '20' : '500'}
                    min="0"
                    max={discountType === 'percentage' ? '100' : undefined}
                    required
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_order_value">Min Order Value (₹)</Label>
                <Input
                  id="min_order_value"
                  type="number"
                  value={minOrderValue}
                  onChange={(e) => setMinOrderValue(e.target.value)}
                  placeholder="0"
                  min="0"
                />
              </div>

              {discountType === 'percentage' && (
                <div className="space-y-2">
                  <Label htmlFor="max_discount">Max Discount (₹)</Label>
                  <Input
                    id="max_discount"
                    type="number"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value)}
                    placeholder="Unlimited"
                    min="0"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="applicable_to">Applicable To *</Label>
              <Select value={applicableTo} onValueChange={(v: any) => setApplicableTo(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_stores">All Stores</SelectItem>
                  <SelectItem value="specific_stores">Specific Stores</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">End Date *</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="usage_limit">Usage Limit (optional)</Label>
              <Input
                id="usage_limit"
                type="number"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                placeholder="Unlimited"
                min="1"
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of times this offer can be used. Leave empty for unlimited.
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Saving...' : editingOffer ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Partner Offer</DialogTitle>
            <DialogDescription>
              {reviewingOffer?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {reviewingOffer && (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Discount:</span> {formatDiscount(reviewingOffer)}
                </div>
                <div>
                  <span className="font-medium">Validity:</span> {new Date(reviewingOffer.start_date).toLocaleDateString()} - {new Date(reviewingOffer.end_date).toLocaleDateString()}
                </div>
                {reviewingOffer.description && (
                  <div>
                    <span className="font-medium">Description:</span> {reviewingOffer.description}
                  </div>
                )}
              </div>
            )}

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
                onClick={() => handleReviewOffer('reject')}
                className="flex-1"
                disabled={loading}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                type="button"
                onClick={() => handleReviewOffer('approve')}
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
