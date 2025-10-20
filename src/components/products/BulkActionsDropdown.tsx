/**
 * Bulk Actions Dropdown
 * Feature 2: PROMPT 8
 * Appears when products are selected in DataTable
 */

import { useState } from "react";
import { 
  Edit2, 
  Package, 
  ToggleLeft, 
  Tag, 
  Trash2, 
  Download,
  Upload
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BulkPriceUpdateDialog } from "./BulkPriceUpdateDialog";
import { BulkStockUpdateDialog } from "./BulkStockUpdateDialog";
import { BulkStatusChangeDialog } from "./BulkStatusChangeDialog";
import { BulkTagsDialog } from "./BulkTagsDialog";
import { BulkDeleteConfirmDialog } from "./BulkDeleteConfirmDialog";
import { CSVImporter } from "./CSVImporter";
import { exportProductsToCSV } from "@/lib/products/csvUtils";

interface BulkActionsDropdownProps {
  selectedProducts: any[];
  selectedCount: number;
  onClearSelection: () => void;
  onSuccess: () => void;
}

export const BulkActionsDropdown = ({
  selectedProducts,
  selectedCount,
  onClearSelection,
  onSuccess
}: BulkActionsDropdownProps) => {
  const [showPriceDialog, setShowPriceDialog] = useState(false);
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showTagsDialog, setShowTagsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showImporter, setShowImporter] = useState(false);

  const handleExport = () => {
    exportProductsToCSV(selectedProducts, `selected-products-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleActionSuccess = () => {
    onSuccess();
    onClearSelection();
  };

  return (
    <>
      <div className="flex items-center gap-3">
        {/* Selection Counter */}
        <Badge variant="default" className="px-3 py-1.5">
          {selectedCount} product{selectedCount !== 1 ? 's' : ''} selected
        </Badge>

        {/* Bulk Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Bulk Actions
              <span className="ml-1">▼</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
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
              Update Tags
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

        {/* Import CSV Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowImporter(true)}
        >
          <Upload className="mr-2 h-4 w-4" />
          Import CSV
        </Button>

        {/* Clear Selection */}
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          Clear Selection
        </Button>
      </div>

      {/* Dialogs */}
      <BulkPriceUpdateDialog
        open={showPriceDialog}
        onOpenChange={setShowPriceDialog}
        selectedProducts={selectedProducts}
        onSuccess={handleActionSuccess}
      />

      <BulkStockUpdateDialog
        open={showStockDialog}
        onOpenChange={setShowStockDialog}
        selectedProducts={selectedProducts}
        onSuccess={handleActionSuccess}
      />

      <BulkStatusChangeDialog
        open={showStatusDialog}
        onOpenChange={setShowStatusDialog}
        selectedProducts={selectedProducts}
        onSuccess={handleActionSuccess}
      />

      <BulkTagsDialog
        open={showTagsDialog}
        onOpenChange={setShowTagsDialog}
        selectedProducts={selectedProducts}
        onSuccess={handleActionSuccess}
      />

      <BulkDeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        selectedProducts={selectedProducts}
        onSuccess={handleActionSuccess}
      />

      <CSVImporter
        open={showImporter}
        onOpenChange={setShowImporter}
        onSuccess={onSuccess}
      />
    </>
  );
};

