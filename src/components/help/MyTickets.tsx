/**
 * My Tickets Component
 * Feature 12: PROMPT 12 - Help Center
 * Displays partner's support tickets in a DataTable
 * Mobile-first design (320px base)
 */

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ExternalLink } from "lucide-react";

interface SupportTicket {
  id: string;
  ticket_number: string;
  partner_id: string;
  subject: string;
  message: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  resolved_at?: string;
}

interface MyTicketsProps {
  tickets: SupportTicket[];
}

/**
 * My Tickets List
 * Shows all support tickets with status and actions
 */
export const MyTickets = ({ tickets }: MyTicketsProps) => {
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  const getStatusBadge = (status: SupportTicket['status']) => {
    const config = {
      open: { variant: 'default' as const, label: '🟡 Open' },
      in_progress: { variant: 'secondary' as const, label: '🔵 In Progress', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100' },
      resolved: { variant: 'secondary' as const, label: '🟢 Resolved', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' },
      closed: { variant: 'outline' as const, label: '⚪ Closed' },
    };
    const statusConfig = config[status];
    return <Badge variant={statusConfig.variant} className={statusConfig.className}>{statusConfig.label}</Badge>;
  };

  const getPriorityBadge = (priority: SupportTicket['priority']) => {
    const config = {
      low: { variant: 'outline' as const, label: 'Low' },
      medium: { variant: 'secondary' as const, label: 'Medium' },
      high: { variant: 'default' as const, label: 'High' },
      urgent: { variant: 'destructive' as const, label: 'Urgent' },
    };
    const priorityConfig = config[priority];
    return <Badge variant={priorityConfig.variant} className="text-xs">{priorityConfig.label}</Badge>;
  };

  if (tickets.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No support tickets yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket #</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead className="hidden md:table-cell">Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell className="font-mono text-sm font-medium">
                  {ticket.ticket_number}
                </TableCell>
                
                <TableCell>
                  <div className="space-y-0.5">
                    <p className="font-medium text-sm line-clamp-1">
                      {ticket.subject}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {ticket.category.replace('_', ' ')}
                    </p>
                  </div>
                </TableCell>

                <TableCell className="hidden md:table-cell">
                  {getPriorityBadge(ticket.priority)}
                </TableCell>

                <TableCell>
                  {getStatusBadge(ticket.status)}
                </TableCell>

                <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                  {new Date(ticket.created_at).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </TableCell>

                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Ticket Detail Sheet */}
      {selectedTicket && (
        <Sheet open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <SheetContent side="right" className="w-full sm:w-[500px]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <span>{selectedTicket.ticket_number}</span>
                {getStatusBadge(selectedTicket.status)}
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Subject</p>
                <p className="font-medium">{selectedTicket.subject}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-medium capitalize">{selectedTicket.category.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Priority</p>
                {getPriorityBadge(selectedTicket.priority)}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Message</p>
                <p className="text-sm whitespace-pre-wrap border rounded-lg p-3 bg-muted/50">
                  {selectedTicket.message}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm">
                  {new Date(selectedTicket.created_at).toLocaleString('en-IN')}
                </p>
              </div>
              {selectedTicket.resolved_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Resolved</p>
                  <p className="text-sm">
                    {new Date(selectedTicket.resolved_at).toLocaleString('en-IN')}
                  </p>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
};

