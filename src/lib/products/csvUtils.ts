import Papa from 'papaparse';
import { Product } from "@/pages/partner/Products";

/**
 * CSV Import/Export Utilities
 * Uses PapaParse for CSV parsing
 * Follows Swiggy/Zomato bulk upload patterns
 */

export interface CSVImportResult {
  success: boolean;
  data?: any[];
  errors?: string[];
  rowCount?: number;
}

/**
 * Export products to CSV
 */
export const exportToCSV = (products: Product[], filename?: string) => {
  const csvData = products.map(p => ({
    name: p.name,
    description: p.description,
    price: p.price / 100, // Convert paise to rupees
    stock: p.stock,
    category: p.category || '',
    is_customizable: p.is_customizable ? 'Yes' : 'No',
    is_active: p.is_active ? 'Active' : 'Inactive',
    estimated_delivery_days: p.estimated_delivery_days || '3-5 days',
  }));

  const csv = Papa.unparse(csvData, {
    columns: ['name', 'description', 'price', 'stock', 'category', 'is_customizable', 'is_active', 'estimated_delivery_days']
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `products-export-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Import products from CSV file
 */
export const importFromCSV = (file: File): Promise<CSVImportResult> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          // Validate columns
          const requiredColumns = ['name', 'price', 'stock'];
          const data = results.data as any[];
          
          if (data.length === 0) {
            reject({ success: false, errors: ['CSV file is empty'] });
            return;
          }

          const headers = Object.keys(data[0]);
          const missing = requiredColumns.filter(col => !headers.includes(col));

          if (missing.length > 0) {
            reject({
              success: false,
              errors: [`Missing required columns: ${missing.join(', ')}`]
            });
            return;
          }

          // Validate data
          const errors: string[] = [];
          const validData: any[] = [];

          data.forEach((row: any, idx: number) => {
            const rowNumber = idx + 2; // +2 for header row and 0-index

            // Validate required fields
            if (!row.name || row.name.trim() === '') {
              errors.push(`Row ${rowNumber}: Name is required`);
              return;
            }

            if (typeof row.price !== 'number' || row.price <= 0) {
              errors.push(`Row ${rowNumber}: Invalid price (must be number > 0)`);
              return;
            }

            if (typeof row.stock !== 'number' || row.stock < 0) {
              errors.push(`Row ${rowNumber}: Invalid stock (must be number ≥ 0)`);
              return;
            }

            // Transform data for database
            validData.push({
              name: row.name.trim(),
              description: row.description || '',
              price: Math.round(row.price * 100), // Convert to paise
              stock: row.stock,
              category: row.category || '',
              is_customizable: row.is_customizable === 'Yes' || row.is_customizable === true,
              is_active: row.is_active !== 'Inactive' && row.is_active !== false,
              estimated_delivery_days: row.estimated_delivery_days || '3-5 days',
            });
          });

          if (errors.length > 0) {
            reject({
              success: false,
              errors,
              rowCount: data.length
            });
            return;
          }

          resolve({
            success: true,
            data: validData,
            rowCount: validData.length
          });
        } catch (error: any) {
          reject({
            success: false,
            errors: [error.message || 'Failed to parse CSV']
          });
        }
      },
      error: (error) => {
        reject({
          success: false,
          errors: [error.message || 'Failed to read CSV file']
        });
      }
    });
  });
};

/**
 * Generate CSV template for download
 */
export const downloadCSVTemplate = () => {
  const templateData = [
    {
      name: 'Example Product',
      description: 'Product description here',
      price: 999,
      stock: 100,
      category: 'Gifts',
      is_customizable: 'No',
      is_active: 'Active',
      estimated_delivery_days: '3-5 days',
    }
  ];

  const csv = Papa.unparse(templateData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'product-import-template.csv';
  link.click();
  URL.revokeObjectURL(url);
};
