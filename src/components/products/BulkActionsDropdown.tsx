import { useState } from "react";
import { Edit2, Package, ToggleLeft, Tag, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BulkPriceUpdateDialog } from "./BulkPriceUpdateDialog";
import { BulkStockUpdateDialog } from "./BulkStockUpdateDialog";
import { BulkStatusChangeDialog } from "./BulkStatusChangeDialog";
import { BulkTagsDialog } from "./BulkTagsDialog";
import { BulkDeleteConfirmDialog } from "./BulkDeleteConfirmDialog";
import { Product } from "@/pages/partner/Products";
import { exportToCSV } from "@/lib/products/csvUtils";

interface BulkActionsDropdownProps {
  selectedProducts: Product[];
  selectedCount: number;
  onClearSelection: () => void;
  onSuccess: () => void;
}

/**
 * Bulk Actions Dropdown
 * Main control for bulk operations on products
 * Follows Swiggy/Zomato menu bulk edit pattern
 */
export const BulkActionsDropdown = ({
  selectedProducts,
  selectedCount,
  onClearSelection,
  onSuccess,
}: BulkActionsDropdownProps) => {
  const [showPriceDialog, setShowPriceDialog] = useState(false);
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showTagsDialog, setShowTagsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleExport = () => {
    exportToCSV(selectedProducts);
  };

  const handleSuccess = () => {
    onSuccess();
    onClearSelection();
  };

  return (
    <>
      {/* Selection Counter & Actions */}
      <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-primary">
            {selectedCount} selected
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-8 text-xs"
          >
            Clear
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              Bulk Actions
              <span className="text-xs">▼</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => setShowPriceDialog(true)}>
              <Edit2 className="mr-2 h-4 w-4" />
              Update Price
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => setShowStockDialog(true)}>
              <Package className="mr-2 h-4 w-4" />
              Update Stock
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => setShowStatusDialog(true)}>
              <ToggleLeft className="mr-2 h-4 w-4" />
              Change Status
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => setShowTagsDialog(true)}>
              <Tag className="mr-2 h-4 w-4" />
              Add Tags
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export Selected
            </DropdownMenuItem>
            
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Products
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Dialogs */}
      <BulkPriceUpdateDialog
        open={showPriceDialog}
        onOpenChange={setShowPriceDialog}
        selectedProducts={selectedProducts}
        onSuccess={handleSuccess}
      />

      <BulkStockUpdateDialog
        open={showStockDialog}
        onOpenChange={setShowStockDialog}
        selectedProducts={selectedProducts}
        onSuccess={handleSuccess}
      />

      <BulkStatusChangeDialog
        open={showStatusDialog}
        onOpenChange={setShowStatusDialog}
        selectedProducts={selectedProducts}
        onSuccess={handleSuccess}
      />

      <BulkTagsDialog
        open={showTagsDialog}
        onOpenChange={setShowTagsDialog}
        selectedProducts={selectedProducts}
        onSuccess={handleSuccess}
      />

      <BulkDeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        selectedProducts={selectedProducts}
        onSuccess={handleSuccess}
      />
    </>
  );
};
