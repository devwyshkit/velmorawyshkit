/**
 * Bulk Operations Types for Partner Products
 * Supports: Price updates, Stock updates, Status changes, Tags, Delete
 * Matches Zomato menu bulk edit (50% time savings)
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
}

// Preview of changes before applying
export interface BulkPreview {
  productId: string;
  productName: string;
  before: Record<string, any>;
  after: Record<string, any>;
}

