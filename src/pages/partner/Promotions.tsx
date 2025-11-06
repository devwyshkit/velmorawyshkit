import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tag, Plus, Edit2, Trash2, Clock, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/integrations/supabase-client";

interface PromotionalOffer {
  id: string;
  title: string;
  description?: string;
  discount_type: 'percentage' | 'fixed' | 'free_delivery';
  discount_value: number;
  start_date: string;
  end_date: string;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'expired';
  admin_notes?: string;
  created_at: string;
}

export const PartnerPromotions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [offers, setOffers] = useState<PromotionalOffer[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingOffer, setEditingOffer] = useState<PromotionalOffer | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | 'free_delivery'>('percentage');
  const [discountValue, setDiscountValue] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    loadOffers();
  }, [user]);

  const loadOffers = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get store_id
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!store) {
        toast({
          title: "Store not found",
          description: "Please complete onboarding first",
          variant: "destructive",
        });
        return;
      }

      // Load offers for this store
      try {
        const { data, error } = await supabase
          .from('promotional_offers')
          .select('*')
          .eq('store_id', store.id)
          .eq('created_by_type', 'partner')
          .order('created_at', { ascending: false });

        if (error) {
          if (error.code === 'PGRST116') {
            // Table doesn't exist - handle gracefully
            console.warn('Promotional offers table not available');
            setOffers([]);
            return;
          }
          throw error;
        }
        setOffers(data || []);
      } catch (error: any) {
        if (error?.code === 'PGRST116' || error?.message?.includes('does not exist')) {
          console.warn('Promotional offers table not available');
          setOffers([]);
          return;
        }
        throw error;
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Get store_id
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!store) throw new Error("Store not found");

      const offerData = {
        created_by_type: 'partner',
        created_by_id: user.id,
        store_id: store.id,
        title,
        description: description || null,
        discount_type: discountType,
        discount_value: discountType === 'free_delivery' ? 0 : parseInt(discountValue),
        min_order_value_paise: 0,
        applicable_to: 'specific_stores',
        applicable_store_ids: [store.id],
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        status: 'pending',
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
          toast({ title: "Offer updated", description: "Waiting for admin approval" });
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
          toast({ title: "Offer created", description: "Waiting for admin approval" });
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

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDiscountType('percentage');
    setDiscountValue("");
    setStartDate("");
    setEndDate("");
    setEditingOffer(null);
  };

  const handleEdit = (offer: PromotionalOffer) => {
    if (offer.status !== 'pending') {
      toast({
        title: "Cannot edit",
        description: "Only pending offers can be edited",
        variant: "destructive",
      });
      return;
    }
    setEditingOffer(offer);
    setTitle(offer.title);
    setDescription(offer.description || "");
    setDiscountType(offer.discount_type);
    setDiscountValue(offer.discount_value.toString());
    setStartDate(offer.start_date.split('T')[0]);
    setEndDate(offer.end_date.split('T')[0]);
    setShowCreateDialog(true);
  };

  const handleDelete = async (offer: PromotionalOffer) => {
    if (offer.status !== 'pending') {
      toast({
        title: "Cannot delete",
        description: "Only pending offers can be deleted",
        variant: "destructive",
      });
      return;
    }

    if (!confirm('Delete this offer?')) return;

    try {
      const { error } = await supabase
        .from('promotional_offers')
        .delete()
        .eq('id', offer.id);

      if (error) throw error;
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

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Promotional Offers</h1>
          <p className="text-sm text-muted-foreground">
            Create offers to attract customers (requires admin approval)
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Offer
        </Button>
      </div>

      {/* Offers List */}
      {offers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No offers yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first promotional offer to attract customers
            </p>
            <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Create Offer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {offers.map((offer) => (
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
                  </div>
                  {offer.status === 'pending' && (
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
                    <p className="font-semibold">
                      {offer.discount_type === 'percentage' && `${offer.discount_value}%`}
                      {offer.discount_type === 'fixed' && `₹${offer.discount_value / 100}`}
                      {offer.discount_type === 'free_delivery' && 'Free Delivery'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Validity:</span>
                    <p className="font-semibold">
                      {new Date(offer.start_date).toLocaleDateString()} - {new Date(offer.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {offer.status === 'rejected' && offer.admin_notes && (
                  <div className="mt-4 p-3 bg-destructive/10 rounded-lg">
                    <p className="text-sm font-medium text-destructive">Rejection Reason:</p>
                    <p className="text-sm text-muted-foreground">{offer.admin_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingOffer ? 'Edit Offer' : 'Create Promotional Offer'}</DialogTitle>
            <DialogDescription>
              Create a promotional offer that will be reviewed by admin
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., 20% Off on All Products"
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
    </div>
  );
};
