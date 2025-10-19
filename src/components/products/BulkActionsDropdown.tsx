/**
 * Bulk Actions Dropdown for Products Page
 * Shows bulk action menu when products are selected
 * Swiggy/Zomato pattern: Menu bulk edit (50% time savings)
 */

import { Edit2, Package, ToggleLeft, Tag, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface BulkActionsDropdownProps {
  selectedCount: number;
  onAction: (action: string) => void;
  disabled?: boolean;
}

export const BulkActionsDropdown = ({
  selectedCount,
  onAction,
  disabled = false
}: BulkActionsDropdownProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Selection Counter */}
      <Badge variant="default" className="bg-primary text-primary-foreground">
        {selectedCount} selected
      </Badge>

      {/* Clear Selection */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onAction('clear')}
        disabled={disabled}
      >
        Clear
      </Button>

      {/* Bulk Actions Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="default" size="sm" disabled={disabled}>
            Bulk Actions ▼
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Batch Operations</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => onAction('update_price')}>
            <Edit2 className="mr-2 h-4 w-4" />
            Update Price
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => onAction('update_stock')}>
            <Package className="mr-2 h-4 w-4" />
            Update Stock
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => onAction('change_status')}>
            <ToggleLeft className="mr-2 h-4 w-4" />
            Change Status
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => onAction('add_tags')}>
            <Tag className="mr-2 h-4 w-4" />
            Add Tags
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => onAction('export_selected')}>
            <Download className="mr-2 h-4 w-4" />
            Export Selected
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={() => onAction('delete')}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Products
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

