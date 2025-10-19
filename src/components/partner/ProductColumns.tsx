import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit2, Trash2, Eye, EyeOff } from "lucide-react";
import { Product } from "@/pages/partner/Products";

interface ProductColumnsProps {
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
}

export const productColumns = ({ onEdit, onDelete }: ProductColumnsProps): ColumnDef<Product>[] => [
  {
    accessorKey: "images",
    header: "Image",
    cell: ({ row }) => (
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
        <img
          src={row.original.images[0] || '/placeholder.svg'}
          alt={row.original.name}
          className="w-full h-full object-cover"
        />
      </div>
    ),
  },
  {
    accessorKey: "name",
    header: "Product Name",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.name}</p>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {row.original.short_desc || row.original.description}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => (
      <span className="font-medium">
        ₹{(row.original.price / 100).toLocaleString('en-IN')}
      </span>
    ),
  },
  {
    accessorKey: "stock",
    header: "Stock",
    cell: ({ row }) => {
      const stock = row.original.stock;
      const isLowStock = stock < 50;
      
      return (
        <div className="flex items-center gap-2">
          <span className={isLowStock ? "text-destructive font-medium" : ""}>
            {stock}
          </span>
          {isLowStock && stock > 0 && (
            <Badge variant="outline" className="text-xs">Low</Badge>
          )}
          {stock === 0 && (
            <Badge variant="destructive" className="text-xs">Out</Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "is_customizable",
    header: "Customization",
    cell: ({ row }) => {
      const addOnsCount = row.original.add_ons?.length || 0;
      
      return row.original.is_customizable ? (
        <Badge variant="secondary" className="text-xs gap-1">
          {addOnsCount} add-on{addOnsCount !== 1 ? 's' : ''}
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground">None</span>
      );
    },
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.is_active ? "default" : "secondary"}>
        {row.original.is_active ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(row.original)}>
            <Edit2 className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => {
              // Toggle active status inline (quick action)
              // Full implementation would update Supabase
            }}
          >
            {row.original.is_active ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Deactivate
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Activate
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => onDelete(row.original.id)}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

