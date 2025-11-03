# Refrens Integration Documentation

## Overview

Refrens is integrated for generating estimates and invoices. GSTIN verification is handled by IDfy (Refrens validates GSTIN internally when creating invoices but doesn't provide a dedicated verification endpoint).

## Credentials

The following credentials are configured for Refrens API:

- **URL Key**: `velmora-labs-private-limited`
- **App ID**: `velmora-labs-private-limited-EfzaJ`
- **App Secret**: `dhfDagwaTH-zXg0xpe3mTgf3` (used as Bearer token)
- **Private Key**: RSA key (available for future use if needed)

## Edge Functions Environment Variables

For Supabase Edge Functions, set these environment variables:

```bash
REFRENS_APP_SECRET=dhfDagwaTH-zXg0xpe3mTgf3
REFRENS_URL_KEY=velmora-labs-private-limited
REFRENS_APP_ID=velmora-labs-private-limited-EfzaJ
WYSHKIT_GSTIN=<Your company GSTIN>  # Optional, for invoices
```

### Setting Edge Function Environment Variables

1. Go to Supabase Dashboard → Edge Functions
2. For each Edge Function (generate-estimate, generate-invoice), set:
   - `REFRENS_APP_SECRET`
   - `REFRENS_URL_KEY`
   - `REFRENS_APP_ID`
   - `WYSHKIT_GSTIN` (optional)

Or use Supabase CLI:
```bash
supabase secrets set REFRENS_APP_SECRET=dhfDagwaTH-zXg0xpe3mTgf3
supabase secrets set REFRENS_URL_KEY=velmora-labs-private-limited
supabase secrets set REFRENS_APP_ID=velmora-labs-private-limited-EfzaJ
```

## API Endpoints

### 1. Generate Estimate

**Edge Function**: `generate-estimate`

**Endpoint**: `POST /functions/v1/generate-estimate`

**Request Body**:
```json
{
  "orderId": "uuid",
  "cartItems": [
    {
      "name": "Item name",
      "price": 1000,
      "quantity": 1
    }
  ],
  "gstin": "29ABCDE1234F1Z5", // Optional
  "customerInfo": {
    "name": "Customer Name",
    "email": "customer@example.com"
  }
}
```

**Response**:
```json
{
  "pdf_url": "https://...",
  "estimate_number": "EST-123",
  "invoice_id": "..."
}
```

**Implementation**: `supabase/functions/generate-estimate/index.ts`

### 2. Generate Invoice

**Edge Function**: `generate-invoice`

**Endpoint**: `POST /functions/v1/generate-invoice`

**Request Body**:
```json
{
  "orderId": "uuid"
}
```

**Response**:
```json
{
  "pdf_url": "https://...",
  "invoice_number": "INV-123",
  "invoice_id": "..."
}
```

**Implementation**: `supabase/functions/generate-invoice/index.ts`

## Refrens API Format

Refrens uses the following endpoint structure:

```
POST https://api.refrens.com/businesses/{urlKey}/invoices
```

**Authentication**: Bearer token (App Secret)

**Request Format**:
```json
{
  "invoiceTitle": "Estimate" | "Invoice",
  "invoiceType": "BOS" | "INVOICE",
  "currency": "INR",
  "billedTo": {
    "name": "Customer Name",
    "email": "customer@example.com",
    "phone": "+91...",
    "street": "Address",
    "city": "City",
    "pincode": "560001",
    "gstin": "29ABCDE1234F1Z5",
    "country": "India"
  },
  "billedBy": {
    "name": "Velmora Labs Private Limited",
    "street": "123 Business Address",
    "city": "Bangalore",
    "pincode": "560001",
    "gstin": "WYSHKIT_GSTIN",
    "country": "India"
  },
  "items": [
    {
      "name": "Item name",
      "rate": 1000,
      "quantity": 1,
      "gstRate": 18
    }
  ],
  "invoiceDate": "2025-01-28",
  "dueDate": "2025-02-27"
}
```

**Response Format**:
```json
{
  "_id": "invoice_id",
  "invoiceNumber": "EST-123",
  "share": {
    "pdf": "https://...pdf",
    "link": "https://...link"
  },
  "finalTotal": {
    "total": 1180,
    "subTotal": 1000,
    "cgst": 90,
    "sgst": 90
  }
}
```

## GSTIN Verification

GSTIN verification is handled by IDfy API (not Refrens). Refrens validates GSTIN internally when creating invoices but doesn't provide a dedicated verification endpoint.

**Edge Function**: `verify-gstin`

**Implementation**: `supabase/functions/verify-gstin/index.ts`

Uses IDfy API for GSTIN verification with caching in `gstin_verification_cache` table.

## References

- Refrens API Documentation: https://help.refrens.com/en/category/api-9h5b0q/
- Generate API Keys: https://help.refrens.com/en/article/how-to-generate-invoice-api-keys-for-your-refrens-account-tk0o0a/
- Invoice API Docs: https://www.refrens.com/api/docs/invoices/



