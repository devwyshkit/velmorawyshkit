/**
 * Stock Alerts Types
 * Feature 3: PROMPT 10
 */

export type StockSeverity = 'low' | 'critical' | 'out_of_stock';

export interface StockAlert {
  product_id: string;
  product_name: string;
  current_stock: number;
  threshold: number;
  location?: string;
  severity: StockSeverity;
}

export interface StockAlertThreshold {
  product_id: string;
  threshold: number;
  enabled: boolean;
}

// Add to existing partner_products table schema
export interface ProductStockFields {
  stock: number;
  stock_alert_threshold: number; // Default 50
  is_active: boolean; // Product active status
  location?: string;
}

