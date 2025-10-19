/**
 * Partner Signup Page
 * Create business account to start onboarding
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Store } from 'lucide-react';
import { supabase } from '@/lib/integrations/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { createPartnerAccount } from '@/lib/integrations/partner-data';

export const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: 'Password must be at least 8 characters',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role: 'partner',
            business_name: formData.businessName,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      // Create partner account
      await createPartnerAccount({
        business_name: formData.businessName,
        owner_name: formData.ownerName,
        email: formData.email,
        phone: formData.phone,
        onboarding_step: 1,
        onboarding_completed: false,
        status: 'pending',
      });

      toast({
        title: 'Account created!',
        description: 'Complete onboarding to start selling',
      });

      // Navigate to onboarding
      navigate('/partner/onboarding?step=1');
    } catch (error: any) {
      toast({
        title: 'Signup failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <Store className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Partner with Wyshkit</CardTitle>
          <CardDescription>Create your business account to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name *</Label>
              <Input
                id="businessName"
                placeholder="Premium Gifts Co"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerName">Owner Name *</Label>
              <Input
                id="ownerName"
                placeholder="John Doe"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Business Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="business@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 8 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/partner/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;

