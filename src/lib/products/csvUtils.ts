/**
 * CSV Import/Export Utilities
 * Uses PapaParse for robust CSV parsing
 * Includes validation and error handling
 */

import Papa from 'papaparse';
import { Product } from '@/pages/partner/Products';

export interface CSVValidationError {
  row: number;
  field: string;
  message: string;
}

export interface CSVImportResult {
  success: boolean;
  data?: Partial<Product>[];
  errors?: CSVValidationError[];
  count?: number;
}

/**
 * Required columns for CSV import
 */
const REQUIRED_COLUMNS = ['name', 'price', 'stock'];

/**
 * Validate CSV data
 */
const validateCSVData = (data: any[]): CSVValidationError[] => {
  const errors: CSVValidationError[] = [];

  data.forEach((row: any, idx: number) => {
    const rowNum = idx + 2; // +2 for header and 0-index

    if (!row.name || row.name.trim() === '') {
      errors.push({ row: rowNum, field: 'name', message: 'Name is required' });
    }

    if (!row.price || isNaN(parseFloat(row.price)) || parseFloat(row.price) <= 0) {
      errors.push({ row: rowNum, field: 'price', message: 'Invalid price (must be > 0)' });
    }

    if (row.stock !== undefined && (isNaN(parseInt(row.stock)) || parseInt(row.stock) < 0)) {
      errors.push({ row: rowNum, field: 'stock', message: 'Invalid stock (must be >= 0)' });
    }
  });

  return errors;
};

/**
 * Import products from CSV file
 */
export const importProductsFromCSV = async (file: File): Promise<CSVImportResult> => {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          // Check for required columns
          const headers = Object.keys(results.data[0] || {});
          const missingColumns = REQUIRED_COLUMNS.filter(col => !headers.includes(col));

          if (missingColumns.length > 0) {
            resolve({
              success: false,
              errors: [{
                row: 1,
                field: 'headers',
                message: `Missing required columns: ${missingColumns.join(', ')}`
              }]
            });
            return;
          }

          // Validate data
          const validationErrors = validateCSVData(results.data as any[]);

          if (validationErrors.length > 0) {
            resolve({
              success: false,
              errors: validationErrors
            });
            return;
          }

          // Transform data to match Product interface
          const products = (results.data as any[]).map((row: any) => ({
            name: row.name,
            description: row.description || '',
            price: Math.round(parseFloat(row.price) * 100), // Convert to paise
            stock: parseInt(row.stock) || 0,
            category: row.category || '',
            tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()) : [],
            is_active: row.is_active !== false,
            is_customizable: row.is_customizable === true,
            images: row.images ? row.images.split(',').map((i: string) => i.trim()) : [],
            add_ons: []
          }));

          resolve({
            success: true,
            data: products,
            count: products.length
          });
        } catch (error: any) {
          resolve({
            success: false,
            errors: [{
              row: 0,
              field: 'general',
              message: `CSV parsing error: ${error.message}`
            }]
          });
        }
      },
      error: (error) => {
        resolve({
          success: false,
          errors: [{
            row: 0,
            field: 'general',
            message: `File reading error: ${error.message}`
          }]
        });
      }
    });
  });
};

/**
 * Export products to CSV
 */
export const exportProductsToCSV = (products: Product[], filename?: string) => {
  const exportData = products.map(p => ({
    name: p.name,
    description: p.description,
    price: (p.price / 100).toFixed(2), // Convert from paise to rupees
    stock: p.stock,
    category: p.category || '',
    tags: p.tags.join(','),
    is_active: p.is_active,
    is_customizable: p.is_customizable,
    images: p.images.join(',')
  }));

  const csv = Papa.unparse(exportData, {
    columns: ['name', 'description', 'price', 'stock', 'category', 'tags', 'is_active', 'is_customizable', 'images']
  });

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `products-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Download CSV template
 */
export const downloadCSVTemplate = () => {
  const template = Papa.unparse({
    fields: ['name', 'description', 'price', 'stock', 'category', 'tags', 'is_active', 'is_customizable'],
    data: [
      ['Sample Product', 'A great product', '999.00', '100', 'Electronics', 'trending,new', 'true', 'false']
    ]
  });

  const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'product-import-template.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

