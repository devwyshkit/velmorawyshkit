/**
 * Bulk Operations Types
 * Feature 2: PROMPT 8
 * Allows partners to perform batch actions on multiple products
 */

export type BulkOperationType = 
  | 'update_price' 
  | 'update_stock' 
  | 'change_status' 
  | 'add_tags' 
  | 'delete';

export interface BulkOperation {
  type: BulkOperationType;
  productIds: string[];
  changes: Record<string, any>;
}

export interface PriceUpdate {
  operation: 'increase' | 'decrease';
  type: 'percentage' | 'flat';
  value: number;
  applyTo: 'retail' | 'wholesale' | 'both';
}

export interface StockUpdate {
  operation: 'set' | 'increase' | 'decrease';
  value: number;
  location?: string;
}

export interface StatusUpdate {
  status: 'active' | 'inactive' | 'out_of_stock';
}

export interface TagsUpdate {
  tags: string[];
  operation: 'add' | 'remove' | 'replace';
}

export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: Array<{
    productId: string;
    productName: string;
    error: string;
  }>;
}

export interface CSVProductRow {
  name: string;
  sku?: string;
  description?: string;
  price: number;
  wholesale_price?: number;
  stock: number;
  category?: string;
  tags?: string;
  is_active?: boolean;
}

