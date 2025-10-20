import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronDown, 
  Edit2, 
  Package, 
  ToggleLeft, 
  Tag, 
  Trash2,
  Download 
} from "lucide-react";
import { BulkPriceDialog } from "./BulkPriceDialog";
import { BulkStockDialog } from "./BulkStockDialog";
import { BulkStatusDialog } from "./BulkStatusDialog";
import { BulkDeleteDialog } from "./BulkDeleteDialog";

interface BulkActionsDropdownProps {
  selectedProducts: any[];
  selectedCount: number;
  onClearSelection: () => void;
  onSuccess: () => void;
}

/**
 * Bulk Actions Dropdown - Swiggy/Zomato Pattern
 * Appears when products are selected
 * Provides batch update/delete operations
 */
export const BulkActionsDropdown = ({
  selectedProducts,
  selectedCount,
  onClearSelection,
  onSuccess,
}: BulkActionsDropdownProps) => {
  const selectedIds = selectedProducts.map(p => p.id);
  
  const handleComplete = () => {
    onClearSelection();
    onSuccess();
  };
  
  const handleExport = () => {
    // Simple CSV export of selected products
    const csv = selectedProducts.map(p => 
      `${p.name},${p.price / 100},${p.stock},${p.is_active ? 'Active' : 'Inactive'}`
    ).join('\n');
    
    const header = 'Name,Price,Stock,Status\n';
    const blob = new Blob([header + csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `selected-products-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };
  const [showPriceDialog, setShowPriceDialog] = useState(false);
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            Bulk Actions
            <Badge variant="destructive" className="ml-1">
              {selectedCount}
            </Badge>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem onClick={() => setShowPriceDialog(true)}>
            <Edit2 className="mr-2 h-4 w-4" />
            Update Prices
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowStockDialog(true)}>
            <Package className="mr-2 h-4 w-4" />
            Update Stock
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowStatusDialog(true)}>
            <ToggleLeft className="mr-2 h-4 w-4" />
            Change Status
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Selected
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Products
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogs */}
      <BulkPriceDialog
        open={showPriceDialog}
        onOpenChange={setShowPriceDialog}
        selectedIds={selectedIds}
        selectedCount={selectedCount}
        onComplete={handleComplete}
      />
      
      <BulkStockDialog
        open={showStockDialog}
        onOpenChange={setShowStockDialog}
        selectedIds={selectedIds}
        selectedCount={selectedCount}
        onComplete={handleComplete}
      />
      
      <BulkStatusDialog
        open={showStatusDialog}
        onOpenChange={setShowStatusDialog}
        selectedIds={selectedIds}
        selectedCount={selectedCount}
        onComplete={handleComplete}
      />
      
      <BulkDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        selectedIds={selectedIds}
        selectedCount={selectedCount}
        onComplete={handleComplete}
      />
    </>
  );
};

