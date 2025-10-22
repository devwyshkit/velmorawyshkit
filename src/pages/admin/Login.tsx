import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/integrations/supabase-client";
import { useTheme } from "@/components/theme-provider";

/**
 * Admin Login Page
 * Separate authentication from partner/customer logins
 * Email/password only (no social auth for internal users)
 * Role-based access control after login
 */
export const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Admin login via Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Check if user is admin
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (adminError || !adminUser) {
        // Not an admin user
        await supabase.auth.signOut();
        throw new Error('Unauthorized: Admin access required');
      }

      // Log admin login in audit trail
      await supabase.from('admin_audit_logs').insert({
        admin_id: adminUser.id,
        action: 'login',
        target_type: 'session',
        details: { email, timestamp: new Date().toISOString() },
        ip_address: '', // TODO: Get client IP
      });

      // Update last login
      await supabase
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', adminUser.id);

      toast({
        title: "Welcome back!",
        description: `Logged in as ${adminUser.name || adminUser.role}`,
      });

      // Navigate to admin dashboard
      navigate("/admin/dashboard");
    } catch (err: any) {
      console.error('Admin login error:', err);
      setError(err.message || "Invalid credentials");
      
      toast({
        title: "Login failed",
        description: err.message || "Please check your credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      
      <Card className="w-full max-w-md relative z-10 shadow-2xl border-slate-700">
        <CardHeader className="space-y-3 text-center pb-6">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <img
              src={isDark ? "/horizontal-no-tagline-fff-transparent-3000x750.png" : "/wyshkit-logo.png"}
              alt="Wyshkit Admin"
              className="h-12"
            />
          </div>
          
          <div>
            <CardTitle className="text-2xl font-bold">Admin Console</CardTitle>
            <CardDescription className="text-slate-400">
              Sign in to access the admin dashboard
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="animate-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@wyshkit.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  autoComplete="email"
                  autoFocus
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 font-semibold"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>

            {/* Security Notice */}
            <p className="text-xs text-center text-muted-foreground mt-4">
              For internal use only. All activities are logged and monitored.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

