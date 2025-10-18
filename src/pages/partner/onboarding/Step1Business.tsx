/**
 * Onboarding Step 1: Business Details
 * Mobile-first form with Shadcn components (reuses customer UI design system)
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { upsertPartnerProfile } from '@/lib/integrations/supabase-data';
import { supabase } from '@/lib/integrations/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { validatePhoneFormat, validatePincodeFormat } from '@/lib/integrations/idfy';

// Validation schema with Indian-specific formats
const businessSchema = z.object({
  business_name: z.string().min(2, 'Business name is required').max(100, 'Name too long'),
  display_name: z.string().min(2, 'Display name is required').max(50, 'Name too long'),
  category: z.enum([
    'Tech Gifts',
    'Gourmet',
    'Chocolates',
    'Personalized',
    'Premium',
    'Food & Beverage',
    'Other'
  ], { required_error: 'Please select a category' }),
  tagline: z.string().max(100, 'Tagline too long').optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().refine(validatePhoneFormat, 'Invalid phone number (must start with 6-9)'),
  address_line1: z.string().min(5, 'Address is required'),
  address_line2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().refine(validatePincodeFormat, 'Invalid pincode (must be 6 digits)'),
});

type BusinessFormValues = z.infer<typeof businessSchema>;

interface Step1BusinessProps {
  onNext: () => void;
  partnerId: string | null;
}

export const Step1Business = ({ onNext, partnerId }: Step1BusinessProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<BusinessFormValues>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      business_name: '',
      display_name: '',
      tagline: '',
      email: '',
      phone: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      pincode: '',
    },
  });

  const onSubmit = async (data: BusinessFormValues) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Authentication required',
          description: 'Please login to continue',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const success = await upsertPartnerProfile({
        user_id: user.id,
        ...data,
        onboarding_step: 1,
        onboarding_status: 'incomplete',
        // Default values for required fields
        pan_number: '',
        pan_verified: false,
        gst_verified: false,
        tan_verified: false,
        bank_account_number: '',
        bank_ifsc: '',
        bank_account_holder: '',
        bank_verified: false,
        warehouse_locations: [],
        lead_time_days: 3,
        accepts_customization: false,
      });

      if (!success) {
        throw new Error('Failed to save business details');
      }

      toast({
        title: 'Business details saved!',
        description: 'Proceeding to KYC verification',
      });

      onNext();
    } catch (error) {
      console.error('Error saving business details:', error);
      toast({
        title: 'Error saving details',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 py-6">
      <div>
        <h2 className="text-2xl font-bold">Business Details</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Tell us about your business
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Business Name */}
          <FormField
            control={form.control}
            name="business_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Legal Business Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Velmora Labs Private Limited" {...field} />
                </FormControl>
                <FormDescription>
                  As per PAN/GST registration
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Display Name */}
          <FormField
            control={form.control}
            name="display_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Premium Gifts Co" {...field} />
                </FormControl>
                <FormDescription>
                  Shown to customers on the platform
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Category */}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Tech Gifts">Tech Gifts</SelectItem>
                    <SelectItem value="Gourmet">Gourmet</SelectItem>
                    <SelectItem value="Chocolates">Chocolates & Sweets</SelectItem>
                    <SelectItem value="Personalized">Personalized Gifts</SelectItem>
                    <SelectItem value="Premium">Premium Hampers</SelectItem>
                    <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tagline */}
          <FormField
            control={form.control}
            name="tagline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tagline (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Premium tech accessories" {...field} />
                </FormControl>
                <FormDescription>
                  A short description of your business
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Email *</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="partner@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Phone */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="9876543210" 
                    maxLength={10}
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  10-digit mobile number (starts with 6-9)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Address */}
          <FormField
            control={form.control}
            name="address_line1"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address Line 1 *</FormLabel>
                <FormControl>
                  <Input placeholder="Shop No. 123, Tech Park" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address_line2"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address Line 2 (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Near Metro Station" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* City, State, Pincode (Mobile: stacked, Desktop: grid) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City *</FormLabel>
                  <FormControl>
                    <Input placeholder="Bangalore" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State *</FormLabel>
                  <FormControl>
                    <Input placeholder="Karnataka" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pincode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pincode *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="560001" 
                      maxLength={6}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Submit Button (mobile-first: full width) */}
          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue to KYC
          </Button>
        </form>
      </Form>
    </div>
  );
};

