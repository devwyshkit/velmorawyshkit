/**
 * CSV Import/Export Utilities
 * Feature 2: PROMPT 8 - Bulk Operations
 * Uses PapaParse for CSV handling
 */

import Papa from 'papaparse';
import { CSVProductRow } from '@/types/bulkOperations';

export interface CSVValidationError {
  row: number;
  field: string;
  message: string;
}

export interface CSVParseResult {
  data: CSVProductRow[];
  errors: CSVValidationError[];
  valid: boolean;
}

/**
 * Parse CSV file and validate data
 */
export const parseProductsCSV = (file: File): Promise<CSVParseResult> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as CSVProductRow[];
        const errors: CSVValidationError[] = [];

        // Validate required columns
        const requiredColumns = ['name', 'price', 'stock'];
        if (data.length > 0) {
          const headers = Object.keys(data[0]);
          const missing = requiredColumns.filter(col => !headers.includes(col));
          
          if (missing.length > 0) {
            reject(new Error(`Missing required columns: ${missing.join(', ')}`));
            return;
          }
        }

        // Validate each row
        data.forEach((row, idx) => {
          const rowNum = idx + 2; // +2 because of header row and 0-index

          if (!row.name || row.name.trim() === '') {
            errors.push({ row: rowNum, field: 'name', message: 'Name is required' });
          }

          if (typeof row.price !== 'number' || row.price <= 0) {
            errors.push({ row: rowNum, field: 'price', message: 'Price must be a positive number' });
          }

          if (typeof row.stock !== 'number' || row.stock < 0) {
            errors.push({ row: rowNum, field: 'stock', message: 'Stock must be a non-negative number' });
          }

          if (row.wholesale_price && row.wholesale_price >= row.price) {
            errors.push({ row: rowNum, field: 'wholesale_price', message: 'Wholesale price must be less than retail price' });
          }
        });

        resolve({
          data,
          errors,
          valid: errors.length === 0
        });
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      }
    });
  });
};

/**
 * Export products to CSV
 */
export const exportProductsToCSV = (
  products: any[],
  filename?: string
): void => {
  const csvData = products.map(p => ({
    name: p.name,
    sku: p.sku || '',
    description: p.description || '',
    price: p.price / 100, // Convert from paise to rupees
    wholesale_price: p.wholesale_price ? p.wholesale_price / 100 : '',
    stock: p.stock,
    category: p.category || '',
    tags: Array.isArray(p.tags) ? p.tags.join(', ') : '',
    is_active: p.is_active ? 'Yes' : 'No'
  }));

  const csv = Papa.unparse(csvData, {
    columns: [
      'name',
      'sku',
      'description',
      'price',
      'wholesale_price',
      'stock',
      'category',
      'tags',
      'is_active'
    ]
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename || `products-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Download CSV template for product import
 */
export const downloadCSVTemplate = (): void => {
  const template = [
    {
      name: 'Example Product',
      sku: 'PROD-001',
      description: 'Product description here',
      price: 1499,
      wholesale_price: 1200,
      stock: 100,
      category: 'Electronics',
      tags: 'trending, featured',
      is_active: 'Yes'
    }
  ];

  const csv = Papa.unparse(template);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', 'products-template.csv');
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

