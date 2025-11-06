import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { RouteMap } from "@/routes";
import { Bell, Shield, Globe, Moon, Database, ChevronRight, CreditCard, Settings as SettingsIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CustomerMobileHeader } from "@/components/customer/shared/CustomerMobileHeader";
import { CustomerBottomNav } from "@/components/customer/shared/CustomerBottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/hooks/use-toast";
import { safeGetItem, safeSetItem } from "@/lib/mock-storage";
import { cn } from "@/lib/utils";

/**
 * Settings - Swiggy 2025 Pattern
 * 
 * Account settings:
 * - Notifications
 * - Privacy
 * - Language
 * - Theme
 * - Data & Privacy
 */
export const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    promotions: true,
    previewReady: true,
    deliveryUpdates: true,
  });
  const [language, setLanguage] = useState('en');
  const [privacy, setPrivacy] = useState({
    shareData: false,
    analytics: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      const stored = localStorage.getItem('wyshkit_settings');
      if (stored) {
        const settings = JSON.parse(stored);
        setNotifications(settings.notifications || notifications);
        setLanguage(settings.language || 'en');
        setPrivacy(settings.privacy || privacy);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = () => {
    try {
      const settings = {
        notifications,
        language,
        privacy,
        theme,
      };
      localStorage.setItem('wyshkit_settings', JSON.stringify(settings));
      toast({
        title: 'Settings saved',
        description: 'Your preferences have been updated.',
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  useEffect(() => {
    saveSettings();
  }, [notifications, language, privacy, theme]);

  const handleNotificationToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handlePrivacyToggle = (key: keyof typeof privacy) => {
    setPrivacy(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <>
      <Helmet>
        <title>Settings | Wyshkit</title>
        <meta name="description" content="Manage your account settings" />
      </Helmet>
      <div className="min-h-screen bg-background pb-[112px]">
        <CustomerMobileHeader title="Settings" showBackButton />

        <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-4 md:space-y-6">
          {/* Notifications Section */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Notifications</h3>
              </div>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label htmlFor="orderUpdates" className="font-medium">Order Updates</Label>
                    <p className="text-xs text-muted-foreground">Get notified about order status changes</p>
                  </div>
                  <Switch
                    id="orderUpdates"
                    checked={notifications.orderUpdates}
                    onCheckedChange={() => handleNotificationToggle('orderUpdates')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label htmlFor="promotions" className="font-medium">Promotions & Offers</Label>
                    <p className="text-xs text-muted-foreground">Receive deals and special offers</p>
                  </div>
                  <Switch
                    id="promotions"
                    checked={notifications.promotions}
                    onCheckedChange={() => handleNotificationToggle('promotions')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label htmlFor="previewReady" className="font-medium">Preview Ready</Label>
                    <p className="text-xs text-muted-foreground">Get notified when design preview is ready</p>
                  </div>
                  <Switch
                    id="previewReady"
                    checked={notifications.previewReady}
                    onCheckedChange={() => handleNotificationToggle('previewReady')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label htmlFor="deliveryUpdates" className="font-medium">Delivery Updates</Label>
                    <p className="text-xs text-muted-foreground">Track your order delivery in real-time</p>
                  </div>
                  <Switch
                    id="deliveryUpdates"
                    checked={notifications.deliveryUpdates}
                    onCheckedChange={() => handleNotificationToggle('deliveryUpdates')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods Section */}
          <Card>
            <CardContent className="p-4">
              <Button
                variant="ghost"
                className="w-full justify-between h-auto py-3"
                onClick={() => navigate(RouteMap.paymentMethods())}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <div className="font-medium">Payment Methods</div>
                    <div className="text-xs text-muted-foreground">Manage saved cards, UPI, and wallets</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            </CardContent>
          </Card>

          {/* Privacy Section */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Privacy</h3>
              </div>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label htmlFor="shareData" className="font-medium">Share Data for Better Experience</Label>
                    <p className="text-xs text-muted-foreground">Help us personalize your experience</p>
                  </div>
                  <Switch
                    id="shareData"
                    checked={privacy.shareData}
                    onCheckedChange={() => handlePrivacyToggle('shareData')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label htmlFor="analytics" className="font-medium">Analytics & Usage Data</Label>
                    <p className="text-xs text-muted-foreground">Help us improve our services</p>
                  </div>
                  <Switch
                    id="analytics"
                    checked={privacy.analytics}
                    onCheckedChange={() => handlePrivacyToggle('analytics')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Language Section */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Language</h3>
              </div>
              <Separator />
              <div className="space-y-2">
                <Button
                  variant={language === 'en' ? 'default' : 'outline'}
                  className="w-full justify-start h-12"
                  onClick={() => setLanguage('en')}
                >
                  English
                  {language === 'en' && <Check className="ml-auto h-4 w-4" />}
                </Button>
                <Button
                  variant={language === 'hi' ? 'default' : 'outline'}
                  className="w-full justify-start h-12"
                  onClick={() => setLanguage('hi')}
                >
                  हिंदी (Hindi)
                  {language === 'hi' && <Check className="ml-auto h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Theme Section */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Moon className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Theme</h3>
              </div>
              <Separator />
              <div className="space-y-2">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  className="w-full justify-start h-12"
                  onClick={() => setTheme('light')}
                >
                  Light
                  {theme === 'light' && <Check className="ml-auto h-4 w-4" />}
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  className="w-full justify-start h-12"
                  onClick={() => setTheme('dark')}
                >
                  Dark
                  {theme === 'dark' && <Check className="ml-auto h-4 w-4" />}
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  className="w-full justify-start h-12"
                  onClick={() => setTheme('system')}
                >
                  System
                  {theme === 'system' && <Check className="ml-auto h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Data & Privacy Section */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Data & Privacy</h3>
              </div>
              <Separator />
              <div className="space-y-3">
                <Button
                  variant="ghost"
                  className="w-full justify-start h-12"
                  onClick={() => {
                    toast({
                      title: 'Download requested',
                      description: 'Your data export will be sent to your email within 24 hours.',
                    });
                  }}
                >
                  Download My Data
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                      toast({
                        title: 'Account deletion requested',
                        description: 'Your account deletion request has been submitted.',
                        variant: 'destructive',
                      });
                    }
                  }}
                >
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <CustomerBottomNav />
      </div>
    </>
  );
};

