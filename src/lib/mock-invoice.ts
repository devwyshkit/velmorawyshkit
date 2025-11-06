// Mock Invoice & Estimate Generation (Zomato 2025 pattern)
// Phase 1 Cleanup: Mock version - will be replaced with Edge Function calls later

import { getOrderById } from './mock-orders';

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  orderNumber: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  gst: number;
  total: number;
  customerInfo: {
    name: string;
    email?: string;
    phone?: string;
    address: string;
    gstin?: string;
  };
  businessInfo: {
    name: string;
    gstin: string;
    address: string;
  };
}

export interface EstimateData {
  estimateNumber: string;
  estimateDate: string;
  orderNumber: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  gst: number;
  total: number;
  customerInfo: {
    name: string;
    email?: string;
    phone?: string;
    address: string;
    gstin?: string;
  };
  businessInfo: {
    name: string;
    gstin: string;
    address: string;
  };
}

/**
 * Generate mock invoice data from order
 */
export function generateMockInvoice(orderId: string): InvoiceData | null {
  const order = getOrderById(orderId);
  if (!order) return null;

  const items = (order.order_items || []).map((item: any) => ({
    name: item.item_name || 'Item',
    quantity: item.quantity || 1,
    unitPrice: item.unit_price || 0,
    total: (item.unit_price || 0) * (item.quantity || 1),
  }));

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const gst = subtotal * 0.18; // 18% GST
  const total = subtotal + gst;

  const deliveryAddress = order.delivery_address || {};
  const addressString = [
    deliveryAddress.house,
    deliveryAddress.area,
    deliveryAddress.city,
    deliveryAddress.pincode,
  ].filter(Boolean).join(', ');

  return {
    invoiceNumber: `INV-${order.order_number || orderId.substring(0, 8)}`,
    invoiceDate: new Date(order.created_at).toLocaleDateString('en-IN'),
    orderNumber: order.order_number || orderId,
    items,
    subtotal,
    gst,
    total,
    customerInfo: {
      name: deliveryAddress.name || 'Customer',
      email: undefined,
      phone: deliveryAddress.phone,
      address: addressString,
      gstin: order.gstin,
    },
    businessInfo: {
      name: 'Wyshkit',
      gstin: '29ABCDE1234F1Z5',
      address: 'Bangalore, Karnataka, India',
    },
  };
}

/**
 * Generate mock estimate data from order
 */
export function generateMockEstimate(orderId: string): EstimateData | null {
  const order = getOrderById(orderId);
  if (!order) return null;

  const items = (order.order_items || []).map((item: any) => ({
    name: item.item_name || 'Item',
    quantity: item.quantity || 1,
    unitPrice: item.unit_price || 0,
    total: (item.unit_price || 0) * (item.quantity || 1),
  }));

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const gst = subtotal * 0.18; // 18% GST
  const total = subtotal + gst;

  const deliveryAddress = order.delivery_address || {};
  const addressString = [
    deliveryAddress.house,
    deliveryAddress.area,
    deliveryAddress.city,
    deliveryAddress.pincode,
  ].filter(Boolean).join(', ');

  return {
    estimateNumber: `EST-${order.order_number || orderId.substring(0, 8)}`,
    estimateDate: new Date().toLocaleDateString('en-IN'),
    orderNumber: order.order_number || orderId,
    items,
    subtotal,
    gst,
    total,
    customerInfo: {
      name: deliveryAddress.name || 'Customer',
      email: undefined,
      phone: deliveryAddress.phone,
      address: addressString,
      gstin: order.gstin,
    },
    businessInfo: {
      name: 'Wyshkit',
      gstin: '29ABCDE1234F1Z5',
      address: 'Bangalore, Karnataka, India',
    },
  };
}

/**
 * Download invoice as PDF (mock - generates blob URL)
 */
export function downloadInvoice(orderId: string): void {
  const invoiceData = generateMockInvoice(orderId);
  if (!invoiceData) {
    console.error('Failed to generate invoice');
    return;
  }

  // Create a simple HTML invoice
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${invoiceData.invoiceNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .info { display: flex; justify-content: space-between; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
        .total { text-align: right; margin-top: 20px; }
        .total-row { font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>TAX INVOICE</h1>
        <p>Invoice #${invoiceData.invoiceNumber}</p>
        <p>Date: ${invoiceData.invoiceDate}</p>
      </div>
      <div class="info">
        <div>
          <h3>Bill To:</h3>
          <p>${invoiceData.customerInfo.name}</p>
          <p>${invoiceData.customerInfo.address}</p>
          ${invoiceData.customerInfo.gstin ? `<p>GSTIN: ${invoiceData.customerInfo.gstin}</p>` : ''}
        </div>
        <div>
          <h3>From:</h3>
          <p>${invoiceData.businessInfo.name}</p>
          <p>${invoiceData.businessInfo.address}</p>
          <p>GSTIN: ${invoiceData.businessInfo.gstin}</p>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${invoiceData.items.map(item => `
            <tr>
              <td>${item.name}</td>
              <td>${item.quantity}</td>
              <td>₹${item.unitPrice.toFixed(2)}</td>
              <td>₹${item.total.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="total">
        <p>Subtotal: ₹${invoiceData.subtotal.toFixed(2)}</p>
        <p>GST (18%): ₹${invoiceData.gst.toFixed(2)}</p>
        <p class="total-row">Total: ₹${invoiceData.total.toFixed(2)}</p>
      </div>
    </body>
    </html>
  `;

  // Create blob and download
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `invoice-${invoiceData.invoiceNumber}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download estimate as PDF (mock - generates blob URL)
 */
export function downloadEstimate(orderId: string): void {
  const estimateData = generateMockEstimate(orderId);
  if (!estimateData) {
    console.error('Failed to generate estimate');
    return;
  }

  // Create a simple HTML estimate
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Estimate ${estimateData.estimateNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .info { display: flex; justify-content: space-between; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
        .total { text-align: right; margin-top: 20px; }
        .total-row { font-weight: bold; }
        .estimate-note { margin-top: 20px; font-style: italic; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>ESTIMATE</h1>
        <p>Estimate #${estimateData.estimateNumber}</p>
        <p>Date: ${estimateData.estimateDate}</p>
      </div>
      <div class="info">
        <div>
          <h3>Bill To:</h3>
          <p>${estimateData.customerInfo.name}</p>
          <p>${estimateData.customerInfo.address}</p>
          ${estimateData.customerInfo.gstin ? `<p>GSTIN: ${estimateData.customerInfo.gstin}</p>` : ''}
        </div>
        <div>
          <h3>From:</h3>
          <p>${estimateData.businessInfo.name}</p>
          <p>${estimateData.businessInfo.address}</p>
          <p>GSTIN: ${estimateData.businessInfo.gstin}</p>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${estimateData.items.map(item => `
            <tr>
              <td>${item.name}</td>
              <td>${item.quantity}</td>
              <td>₹${item.unitPrice.toFixed(2)}</td>
              <td>₹${item.total.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="total">
        <p>Subtotal: ₹${estimateData.subtotal.toFixed(2)}</p>
        <p>GST (18%): ₹${estimateData.gst.toFixed(2)}</p>
        <p class="total-row">Total: ₹${estimateData.total.toFixed(2)}</p>
      </div>
      <div class="estimate-note">
        <p>This is an estimate. Final amount may vary based on actual order.</p>
      </div>
    </body>
    </html>
  `;

  // Create blob and download
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `estimate-${estimateData.estimateNumber}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

