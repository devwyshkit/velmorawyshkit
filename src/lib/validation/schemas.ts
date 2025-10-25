import { z } from 'zod';

// UUID validation
export const UUIDSchema = z.string().uuid('Invalid UUID format');

// Email validation
export const EmailSchema = z.string().email('Invalid email format');

// Phone validation (international format)
export const PhoneSchema = z.string().regex(
  /^\+?[1-9]\d{1,14}$/,
  'Invalid phone number format'
);

// Name validation
export const NameSchema = z.string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces');

// Address validation
export const AddressSchema = z.object({
  street: z.string().min(5, 'Street address must be at least 5 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  state: z.string().min(2, 'State must be at least 2 characters'),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  country: z.string().default('India')
});

// Product validation
export const ProductSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().int().min(1, 'Price must be at least 1 paise'),
  category: z.string().min(2, 'Category is required'),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  images: z.array(z.string().url()).min(1, 'At least one image is required')
});

// Order validation
export const OrderSchema = z.object({
  customer_id: UUIDSchema,
  partner_id: UUIDSchema,
  items: z.array(z.object({
    product_id: UUIDSchema,
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    price: z.number().int().min(1, 'Price must be at least 1 paise')
  })).min(1, 'At least one item is required'),
  total: z.number().int().min(1, 'Total must be at least 1 paise')
});

// Review validation
export const ReviewSchema = z.object({
  partner_id: UUIDSchema,
  customer_id: UUIDSchema,
  order_id: UUIDSchema,
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  comment: z.string().min(10, 'Comment must be at least 10 characters')
    .max(500, 'Comment must be less than 500 characters')
});

// Search query validation
export const SearchQuerySchema = z.string()
  .min(2, 'Search query must be at least 2 characters')
  .max(100, 'Search query must be less than 100 characters')
  .regex(/^[a-zA-Z0-9\s]+$/, 'Search query can only contain letters, numbers, and spaces');

// Pagination validation
export const PaginationSchema = z.object({
  page: z.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.number().int().min(1).max(100, 'Limit must be between 1 and 100').default(20)
});

// Partner profile validation
export const PartnerProfileSchema = z.object({
  business_name: z.string().min(3, 'Business name must be at least 3 characters'),
  category: z.string().min(2, 'Category is required'),
  business_type: z.string().optional(),
  phone: PhoneSchema,
  address: AddressSchema,
  pan_number: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format'),
  gst_number: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST format'),
  bank_account_number: z.string().regex(/^[0-9]{9,18}$/, 'Invalid bank account number'),
  bank_ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code'),
  bank_account_name: z.string().min(2, 'Account name must be at least 2 characters')
});

// Admin action validation
export const AdminActionSchema = z.object({
  action_type: z.string().min(2, 'Action type is required'),
  target_id: z.string().optional(),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional()
});

// Rate limiting validation
export const RateLimitSchema = z.object({
  key: z.string().min(1, 'Rate limit key is required'),
  maxRequests: z.number().int().min(1, 'Max requests must be at least 1'),
  windowMs: z.number().int().min(1000, 'Window must be at least 1000ms')
});

// CSRF token validation
export const CSRFTokenSchema = z.string()
  .uuid('Invalid CSRF token format');

// File upload validation
export const FileUploadSchema = z.object({
  file: z.instanceof(File),
  maxSize: z.number().int().min(1).default(5 * 1024 * 1024), // 5MB default
  allowedTypes: z.array(z.string()).default(['image/jpeg', 'image/png', 'image/webp'])
});

// Location validation
export const LocationSchema = z.object({
  latitude: z.number().min(-90).max(90, 'Invalid latitude'),
  longitude: z.number().min(-180).max(180, 'Invalid longitude'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  country: z.string().default('India')
});

// Export all schemas for easy importing
export const ValidationSchemas = {
  UUID: UUIDSchema,
  Email: EmailSchema,
  Phone: PhoneSchema,
  Name: NameSchema,
  Address: AddressSchema,
  Product: ProductSchema,
  Order: OrderSchema,
  Review: ReviewSchema,
  SearchQuery: SearchQuerySchema,
  Pagination: PaginationSchema,
  PartnerProfile: PartnerProfileSchema,
  AdminAction: AdminActionSchema,
  RateLimit: RateLimitSchema,
  CSRFToken: CSRFTokenSchema,
  FileUpload: FileUploadSchema,
  Location: LocationSchema
} as const;
