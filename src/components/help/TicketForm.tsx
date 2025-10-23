/**
 * Support Ticket Form Component
 * Feature 12: PROMPT 12 - Help Center
 * Create new support tickets with attachments
 * Mobile-first design (320px base)
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "z od";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ticket, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/integrations/supabase-client";

const ticketSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  category: z.string().min(1, "Please select a category"),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  message: z.string().min(50, "Message must be at least 50 characters"),
});

type TicketFormValues = z.infer<typeof ticketSchema>;

interface TicketFormProps {
  onSuccess?: (ticketId: string) => void;
}

/**
 * Create Support Ticket Form
 * Collects all necessary info for support request
 */
export const TicketForm = ({ onSuccess }: TicketFormProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      subject: "",
      category: "",
      priority: "medium",
      message: "",
    },
  });

  const onSubmit = async (data: TicketFormValues) => {
    if (!user) return;

    setSubmitting(true);
    try {
      const ticketNumber = `TKT-${Date.now().toString().slice(-5)}`;

      const { data: ticket, error } = await supabase
        .from('support_tickets')
        .insert({
          ticket_number: ticketNumber,
          partner_id: user.id,
          subject: data.subject,
          message: data.message,
          category: data.category,
          priority: data.priority,
          status: 'open',
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Ticket created successfully",
        description: `Ticket #${ticketNumber} - We'll respond within 24 hours`,
        duration: 5000,
      });

      setOpen(false);
      form.reset();
      
      if (onSuccess && ticket) {
        onSuccess(ticket.id);
      }
    } catch (error: any) {
      console.error('Create ticket error:', error);
      toast({
        title: "Failed to create ticket",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Ticket className="h-4 w-4" />
          Create Support Ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Support Ticket</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              placeholder="Brief description of your issue"
              {...form.register("subject")}
            />
            {form.formState.errors.subject && (
              <p className="text-sm text-destructive">
                {form.formState.errors.subject.message}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={form.watch("category")}
              onValueChange={(value) => form.setValue("category", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="getting_started">📦 Getting Started</SelectItem>
                <SelectItem value="products">💰 Products & Pricing</SelectItem>
                <SelectItem value="orders">🚚 Orders</SelectItem>
                <SelectItem value="payments">💳 Payments & Payouts</SelectItem>
                <SelectItem value="customization">🎨 Customization & Branding</SelectItem>
                <SelectItem value="account">⚙️ Account & Settings</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.category && (
              <p className="text-sm text-destructive">
                {form.formState.errors.category.message}
              </p>
            )}
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priority *</Label>
            <RadioGroup
              value={form.watch("priority")}
              onValueChange={(value) => form.setValue("priority", value as any)}
              className="flex flex-wrap gap-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="low" id="low" />
                <Label htmlFor="low" className="font-normal cursor-pointer">
                  Low
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium" id="medium" />
                <Label htmlFor="medium" className="font-normal cursor-pointer">
                  Medium
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="high" id="high" />
                <Label htmlFor="high" className="font-normal cursor-pointer">
                  High
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="urgent" id="urgent" />
                <Label htmlFor="urgent" className="font-normal cursor-pointer">
                  Urgent
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              placeholder="Describe your issue in detail (min 50 characters)"
              rows={6}
              {...form.register("message")}
              className="resize-none"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {form.watch("message")?.length || 0}/50 minimum
              </p>
              {form.formState.errors.message && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.message.message}
                </p>
              )}
            </div>
          </div>

          {/* Attachments (Future Feature) */}
          <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            <Paperclip className="h-4 w-4 inline mr-2" />
            File attachments coming soon
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Creating..." : "Create Ticket"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

