/**
 * Chat Widget Component
 * Feature 12: PROMPT 12 - Help Center
 * Simple Supabase realtime chat for support
 * Mobile-first design (320px base)
 */

import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Send, Paperclip } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/integrations/supabase-client";
import { cn } from "@/lib/utils";

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_type: 'partner' | 'agent';
  sender_name: string;
  message: string;
  attachments?: string[];
  created_at: string;
}

interface ChatWidgetProps {
  ticketId?: string;
  onCreateTicket?: () => void;
}

/**
 * Simple Chat Widget (Supabase Realtime)
 * Alternative to Intercom/Crisp for self-hosted support
 * Shows "Leave a message" if no ticket active
 */
export const ChatWidget = ({ ticketId, onCreateTicket }: ChatWidgetProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!ticketId || !open) return;

    loadMessages();

    const channel = supabase
      .channel(`ticket-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_messages',
          filter: `ticket_id=eq.${ticketId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as TicketMessage]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, open]);

  const loadMessages = async () => {
    if (!ticketId) return;

    const { data, error } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Load messages error:', error);
    } else {
      setMessages(data || []);
      scrollToBottom();
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleSend = async () => {
    if (!input.trim() || !ticketId || !user) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticketId,
          sender_type: 'partner',
          sender_name: user.name || 'Partner',
          message: input.trim(),
        });

      if (error) throw error;

      setInput("");
      scrollToBottom();
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg z-50 md:bottom-6"
          aria-label="Help & Support"
        >
          <HelpCircle className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="right" 
        className="w-full sm:w-[400px] p-0 flex flex-col h-full"
      >
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center justify-between">
            <span>Support Chat</span>
            <Badge variant="secondary" className="gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              Online
            </Badge>
          </SheetTitle>
        </SheetHeader>

        {/* Chat Messages */}
        {ticketId ? (
          <>
            <ScrollArea ref={scrollRef} className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex",
                      msg.sender_type === 'partner' ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg p-3 space-y-1",
                        msg.sender_type === 'partner'
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.message}
                      </p>
                      <p className={cn(
                        "text-xs",
                        msg.sender_type === 'partner'
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      )}>
                        {new Date(msg.created_at).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t space-y-2">
              <Textarea
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={3}
                disabled={sending}
                className="resize-none"
              />
              <div className="flex items-center justify-between gap-2">
                <Button variant="ghost" size="sm" disabled>
                  <Paperclip className="h-4 w-4 mr-2" />
                  Attach
                </Button>
                <Button
                  size="sm"
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sending ? "Sending..." : "Send"}
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* No Active Ticket - Prompt to Create */
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center space-y-4">
              <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto" />
              <div className="space-y-2">
                <h3 className="font-semibold">Need Help?</h3>
                <p className="text-sm text-muted-foreground">
                  Start a conversation with our support team
                </p>
              </div>
              <Button onClick={onCreateTicket}>
                Create Support Ticket
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

