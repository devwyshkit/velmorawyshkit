/**
 * Onboarding Step 4: Initial Catalog Setup
 * Upload 1-3 products to get started (can add more later in dashboard)
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { upsertPartnerProfile } from '@/lib/integrations/supabase-data';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Package, CheckCircle } from 'lucide-react';

interface Step4CatalogProps {
  onComplete: () => void;
  onBack: () => void;
  partnerId: string;
}

export const Step4Catalog = ({ onComplete, onBack, partnerId }: Step4CatalogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [skipCatalog, setSkipCatalog] = useState(false);

  // Simplified form (partners can add detailed products later in dashboard)
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productDesc, setProductDesc] = useState('');

  const handleSkipAndSubmit = async () => {
    setSkipCatalog(true);
    await handleSubmit(true);
  };

  const handleSubmit = async (skip = false) => {
    setLoading(true);

    try {
      // Update onboarding status to pending_review
      await upsertPartnerProfile({
        id: partnerId,
        onboarding_step: 4,
        onboarding_status: 'pending_review',
      });

      toast({
        title: skip ? 'Application submitted!' : 'Catalog saved!',
        description: 'Your application is under review. We\'ll notify you within 24 hours.',
      });

      onComplete();
    } catch (error) {
      toast({
        title: 'Error submitting application',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 py-6">
      <div>
        <h2 className="text-2xl font-bold">Initial Catalog</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Add a product to get started (or skip and add later)
        </p>
      </div>

      {/* Info Card */}
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <div className="flex gap-3">
          <Package className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Quick Setup</p>
            <p className="text-xs text-muted-foreground">
              You can add products now or skip and add them later from your partner dashboard.
              Adding at least one product helps us review your application faster.
            </p>
          </div>
        </div>
      </div>

      {/* Simple Product Form */}
      {!skipCatalog && (
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="font-semibold">Sample Product (Optional)</h3>

          <div className="space-y-3">
            <div>
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                placeholder="Premium Gift Hamper"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="price">Price (₹)</Label>
              <Input
                id="price"
                type="number"
                placeholder="2499"
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="desc">Short Description</Label>
              <Textarea
                id="desc"
                placeholder="Brief description of your product"
                value={productDesc}
                onChange={(e) => setProductDesc(e.target.value)}
                rows={3}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              You can add images and detailed specifications from the dashboard after approval
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3 pt-4">
        {!skipCatalog && (
          <Button
            onClick={() => handleSubmit(false)}
            disabled={loading || !productName || !productPrice}
            className="w-full"
            size="lg"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <CheckCircle className="mr-2 h-4 w-4" />
            Save Product & Submit for Review
          </Button>
        )}

        <Button
          onClick={handleSkipAndSubmit}
          disabled={loading}
          variant={skipCatalog ? "default" : "outline"}
          className="w-full"
          size="lg"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {skipCatalog ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Submit for Review
            </>
          ) : (
            'Skip & Submit for Review'
          )}
        </Button>

        <Button onClick={onBack} variant="ghost" className="w-full">
          Back
        </Button>
      </div>

      {/* What Happens Next */}
      <div className="p-4 bg-muted/50 rounded-lg space-y-2">
        <h4 className="text-sm font-semibold">What happens next?</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Our team will review your application within 24 hours</li>
          <li>• You'll receive an email notification about the approval status</li>
          <li>• Once approved, you can access your partner dashboard</li>
          <li>• Add products, manage orders, and start earning!</li>
        </ul>
      </div>
    </div>
  );
};

