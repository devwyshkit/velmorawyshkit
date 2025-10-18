/**
 * Partner Login Page
 * Email/password auth (reuses customer UI design system)
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/integrations/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield } from 'lucide-react';

export const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Check if user is admin (admins use partner login too)
        const { data: userData } = await supabase.auth.getUser();
        const userRole = userData.user?.app_metadata?.role || userData.user?.user_metadata?.role;

        if (userRole === 'admin') {
          // Admin - redirect to admin console
          navigate('/admin/overview');
          toast({ title: 'Welcome back, Admin!' });
          setLoading(false);
          return;
        }

        // Check if partner profile exists
        const { data: profile } = await supabase
          .from('partner_profiles')
          .select('onboarding_status, onboarding_step')
          .eq('user_id', data.user.id)
          .single();

        if (!profile) {
          // New partner - start onboarding
          navigate('/partner/onboarding');
        } else if (profile.onboarding_status === 'approved') {
          // Approved - go to dashboard
          navigate('/partner/dashboard');
        } else if (profile.onboarding_status === 'pending_review') {
          // Pending approval
          navigate('/partner/pending');
        } else {
          // Resume onboarding from last step
          navigate('/partner/onboarding');
        }

        toast({ title: 'Welcome back!' });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid credentials',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/wyshkit-business-logo.png" 
              alt="Wyshkit" 
              className="h-12 w-auto"
            />
          </div>
          <CardTitle className="text-2xl">Partner Login</CardTitle>
          <CardDescription>Sign in to your partner dashboard</CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="partner@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              New partner?{' '}
              <Link to="/partner/signup" className="text-primary hover:underline">
                Apply now
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link to="/" className="text-xs text-muted-foreground hover:underline">
              Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

