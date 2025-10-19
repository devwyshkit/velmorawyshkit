/**
 * Partner Login Page
 * Email/password auth for business accounts (Swiggy pattern)
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
import { getPartnerAccount } from '@/lib/integrations/partner-data';

export const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      // Check partner account status
      const account = await getPartnerAccount();
      
      if (!account) {
        toast({
          title: 'Not a partner account',
          description: 'Please sign up as a partner first',
          variant: 'destructive',
        });
        await supabase.auth.signOut();
        return;
      }

      // Route based on onboarding/approval status
      if (!account.onboarding_completed) {
        navigate(`/partner/onboarding?step=${account.onboarding_step}`);
      } else if (account.status === 'pending') {
        navigate('/partner/pending');
      } else if (account.status === 'approved') {
        navigate('/partner/dashboard');
      } else {
        toast({
          title: 'Account suspended',
          description: 'Please contact support',
          variant: 'destructive',
        });
        await supabase.auth.signOut();
      }
    } catch (error: any) {
      toast({
        title: 'Login failed',
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
          <CardTitle className="text-2xl">Partner Login</CardTitle>
          <CardDescription>Sign in to manage your business on Wyshkit</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Business Email</Label>
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              New to Wyshkit?{' '}
              <Link to="/partner/signup" className="text-primary hover:underline">
                Partner with us
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;

