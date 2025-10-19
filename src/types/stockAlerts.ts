/**
 * Stock Alerts Types
 * Real-time inventory monitoring (Zomato pattern)
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

export interface StockAlertConfig {
  threshold: number;          // Default: 50
  criticalThreshold: number;  // Default: 20
  enableAutoDisable: boolean; // Auto-disable sourcing when stock = 0
}

// Add to products table schema
export interface ProductStockFields {
  stock_alert_threshold: number;  // Default 50
  sourcing_available: boolean;     // Auto-disable when stock = 0
}

