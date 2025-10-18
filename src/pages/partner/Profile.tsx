/**
 * Partner Profile Page
 * Edit business settings and KYC details
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Building, FileText, CreditCard, Settings, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  fetchPartnerProfile,
  upsertPartnerProfile,
  type PartnerProfile,
} from '@/lib/integrations/supabase-data';
import { supabase } from '@/lib/integrations/supabase-client';

export const Profile = () => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    display_name: '',
    tagline: '',
    email: '',
    phone: '',
    lead_time_days: 3,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fetchedProfile = await fetchPartnerProfile(user.id);
      if (fetchedProfile) {
        setProfile(fetchedProfile);
        setFormData({
          display_name: fetchedProfile.display_name,
          tagline: fetchedProfile.tagline || '',
          email: fetchedProfile.email,
          phone: fetchedProfile.phone,
          lead_time_days: fetchedProfile.lead_time_days,
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast({ title: 'Error loading profile', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const success = await upsertPartnerProfile({
        id: profile.id,
        ...formData,
      });

      if (success) {
        toast({ title: 'Profile updated successfully!' });
        setEditing(false);
        loadProfile();
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({ title: 'Error saving profile', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your business settings</p>
        </div>
        <Badge variant={profile.onboarding_status === 'approved' ? 'default' : 'secondary'}>
          {profile.onboarding_status}
        </Badge>
      </div>

      {/* Business Details */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            <CardTitle>Business Details</CardTitle>
          </div>
          {!editing ? (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => {
                setEditing(false);
                // Reset form
                setFormData({
                  display_name: profile.display_name,
                  tagline: profile.tagline || '',
                  email: profile.email,
                  phone: profile.phone,
                  lead_time_days: profile.lead_time_days,
                });
              }}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                Save
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <>
              <div>
                <Label htmlFor="display">Display Name</Label>
                <Input
                  id="display"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="Premium tech accessories"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  maxLength={10}
                />
              </div>
              <div>
                <Label htmlFor="lead_time">Default Lead Time (days)</Label>
                <Input
                  id="lead_time"
                  type="number"
                  value={formData.lead_time_days}
                  onChange={(e) => setFormData({ ...formData, lead_time_days: parseInt(e.target.value) || 3 })}
                />
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Legal Name</p>
                <p className="text-sm font-medium">{profile.business_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Display Name</p>
                <p className="text-sm font-medium">{profile.display_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="text-sm font-medium">{profile.category}</p>
              </div>
              {profile.tagline && (
                <div>
                  <p className="text-sm text-muted-foreground">Tagline</p>
                  <p className="text-sm font-medium">{profile.tagline}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{profile.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">{profile.phone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="text-sm font-medium">
                  {profile.address_line1}, {profile.city}, {profile.state} - {profile.pincode}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Default Lead Time</p>
                <p className="text-sm font-medium">{profile.lead_time_days} days</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KYC Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>KYC Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="text-sm font-medium">PAN: {profile.pan_number}</p>
              <p className="text-xs text-muted-foreground">Tax identification</p>
            </div>
            {profile.pan_verified ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
          </div>

          {profile.gst_number && (
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">GST: {profile.gst_number}</p>
                <p className="text-xs text-muted-foreground">Goods & Services Tax</p>
              </div>
              {profile.gst_verified ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
          )}

          {profile.tan_number && (
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">TAN: {profile.tan_number}</p>
                <p className="text-xs text-muted-foreground">Tax deduction account</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bank Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <CardTitle>Bank Account</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="text-sm font-medium">Account: ****{profile.bank_account_number.slice(-4)}</p>
              <p className="text-xs text-muted-foreground">IFSC: {profile.bank_ifsc}</p>
              <p className="text-xs text-muted-foreground">Name: {profile.bank_account_holder}</p>
            </div>
            {profile.bank_verified ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Payouts are sent to this account monthly
          </p>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <CardTitle>Settings</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="text-sm font-medium">Customization Services</p>
              <p className="text-xs text-muted-foreground">Accept personalized orders</p>
            </div>
            <Badge variant={profile.accepts_customization ? 'default' : 'outline'}>
              {profile.accepts_customization ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="text-sm font-medium">Warehouse Locations</p>
              <p className="text-xs text-muted-foreground">
                {profile.warehouse_locations.length === 0 
                  ? 'No locations added' 
                  : `${profile.warehouse_locations.length} location(s)`}
              </p>
            </div>
          </div>

          {profile.warehouse_locations.length > 0 && (
            <div className="space-y-2 pl-3">
              {profile.warehouse_locations.map((location, idx) => (
                <div key={idx} className="text-xs p-2 bg-muted rounded">
                  {location.city}, {location.pincode}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card className="bg-muted/50">
        <CardContent className="p-4 space-y-2">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold">Account created:</span>{' '}
            {new Date(profile.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          {profile.approved_at && (
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold">Approved on:</span>{' '}
              {new Date(profile.approved_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

