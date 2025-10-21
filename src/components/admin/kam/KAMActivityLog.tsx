/**
 * KAM Activity Log Component
 * Log and view KAM-partner interactions (calls, meetings, contracts)
 */

import { useState } from "react";
import { Phone, Mail, Calendar, FileText, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/integrations/supabase-client";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  activity_type: 'call' | 'email' | 'meeting' | 'contract_sent' | 'contract_signed';
  subject?: string;
  notes: string;
  outcome?: 'successful' | 'follow_up_needed' | 'closed';
  next_followup?: string;
  created_at: string;
}

interface KAMActivityLogProps {
  partnerId: string;
  kamId: string;
  activities: Activity[];
  onActivityAdded: () => void;
}

export const KAMActivityLog = ({
  partnerId,
  kamId,
  activities,
  onActivityAdded,
}: KAMActivityLogProps) => {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [activityType, setActivityType] = useState<Activity['activity_type']>('call');
  const [subject, setSubject] = useState("");
  const [notes, setNotes] = useState("");
  const [outcome, setOutcome] = useState<Activity['outcome']>('successful');
  const [nextFollowup, setNextFollowup] = useState("");
  const [loading, setLoading] = useState(false);

  const getActivityIcon = (type: Activity['activity_type']) => {
    const icons = {
      call: Phone,
      email: Mail,
      meeting: Calendar,
      contract_sent: FileText,
      contract_signed: FileText,
    };
    return icons[type];
  };

  const handleLogActivity = async () => {
    if (!notes.trim()) {
      toast({
        title: "Notes required",
        description: "Please add activity notes",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('kam_activities')
        .insert({
          kam_id: kamId,
          partner_id: partnerId,
          activity_type: activityType,
          subject: subject.trim() || null,
          notes: notes.trim(),
          outcome: outcome,
          next_followup: nextFollowup || null,
        });

      if (error) throw error;

      toast({
        title: "Activity logged",
        description: "KAM activity recorded successfully",
      });

      // Reset form
      setSubject("");
      setNotes("");
      setNextFollowup("");
      setShowAddDialog(false);
      onActivityAdded();
    } catch (error: any) {
      toast({
        title: "Failed to log activity",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">KAM Activity History</CardTitle>
            <Button size="sm" onClick={() => setShowAddDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Log Activity
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No activities logged yet. Start by logging your first interaction!
            </p>
          ) : (
            <div className="space-y-3">
              {activities.map(activity => {
                const Icon = getActivityIcon(activity.activity_type);
                return (
                  <div key={activity.id} className="flex gap-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-medium text-sm">
                          {activity.subject || activity.activity_type.replace('_', ' ').toUpperCase()}
                        </p>
                        {activity.outcome && (
                          <Badge variant="outline" className="text-xs">
                            {activity.outcome.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{activity.notes}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}</span>
                        {activity.next_followup && (
                          <span className="text-amber-600 dark:text-amber-400">
                            📅 Follow-up: {new Date(activity.next_followup).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Activity Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log KAM Activity</DialogTitle>
            <DialogDescription>
              Record your interaction with this partner
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Activity Type</Label>
              <Select value={activityType} onValueChange={(v: any) => setActivityType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">📞 Phone Call</SelectItem>
                  <SelectItem value="email">📧 Email</SelectItem>
                  <SelectItem value="meeting">🤝 Meeting</SelectItem>
                  <SelectItem value="contract_sent">📝 Contract Sent</SelectItem>
                  <SelectItem value="contract_signed">✅ Contract Signed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Subject (Optional)</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="E.g., Quarterly business review"
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detailed notes about the interaction..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Outcome</Label>
                <Select value={outcome} onValueChange={(v: any) => setOutcome(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="successful">✅ Successful</SelectItem>
                    <SelectItem value="follow_up_needed">🔄 Follow-up Needed</SelectItem>
                    <SelectItem value="closed">✓ Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Next Follow-up (Optional)</Label>
                <Input
                  type="date"
                  value={nextFollowup}
                  onChange={(e) => setNextFollowup(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleLogActivity} disabled={loading}>
              {loading ? 'Logging...' : 'Log Activity'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

