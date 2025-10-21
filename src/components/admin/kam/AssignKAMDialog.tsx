/**
 * Assign KAM Dialog
 * Assign a Key Account Manager to a partner
 */

import { useState, useEffect } from "react";
import { UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/integrations/supabase-client";

interface KAMUser {
  id: string;
  name: string;
  email: string;
  kam_specialization?: string;
}

interface AssignKAMDialogProps {
  partnerId: string;
  partnerName: string;
  currentKAMId?: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AssignKAMDialog = ({
  partnerId,
  partnerName,
  currentKAMId,
  open,
  onClose,
  onSuccess,
}: AssignKAMDialogProps) => {
  const { toast } = useToast();
  const [kamUsers, setKamUsers] = useState<KAMUser[]>([]);
  const [selectedKAMId, setSelectedKAMId] = useState(currentKAMId || "");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadKAMUsers();
    }
  }, [open]);

  const loadKAMUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, name, email, kam_specialization')
        .eq('is_kam', true)
        .eq('is_active', true);

      if (error) {
        console.warn('KAM users fetch failed, using mock:', error);
        setKamUsers([
          {
            id: 'bbbbbbbb-cccc-dddd-eeee-222222222222',
            name: 'Platform Administrator',
            email: 'admin@wyshkit.com',
            kam_specialization: 'premium',
          },
        ]);
      } else {
        setKamUsers(data || []);
      }
    } catch (error) {
      console.error('Load KAM users error:', error);
    }
  };

  const handleAssign = async () => {
    if (!selectedKAMId) {
      toast({
        title: "Select a KAM",
        description: "Please select a Key Account Manager",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Insert or update assignment
      const { error } = await supabase
        .from('kam_partner_assignments')
        .upsert({
          kam_id: selectedKAMId,
          partner_id: partnerId,
          notes: notes.trim() || null,
          is_active: true,
        }, {
          onConflict: 'kam_id,partner_id',
        });

      if (error) throw error;

      toast({
        title: "KAM assigned",
        description: `${partnerName} is now managed by selected KAM`,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Assignment failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Key Account Manager</DialogTitle>
          <DialogDescription>
            Assign a KAM to manage relationship with {partnerName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Select KAM</Label>
            <Select value={selectedKAMId} onValueChange={setSelectedKAMId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a KAM..." />
              </SelectTrigger>
              <SelectContent>
                {kamUsers.map(kam => (
                  <SelectItem key={kam.id} value={kam.id}>
                    <div className="flex items-center gap-2">
                      <span>{kam.name}</span>
                      {kam.kam_specialization && (
                        <span className="text-xs text-muted-foreground">
                          ({kam.kam_specialization})
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Assignment Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g., High-value corporate client, requires weekly check-ins..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={loading} className="gap-2">
            <UserPlus className="h-4 w-4" />
            {loading ? 'Assigning...' : 'Assign KAM'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

