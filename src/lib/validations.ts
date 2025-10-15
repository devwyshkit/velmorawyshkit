import { z } from 'zod';

// Form Validation Schemas - Production Ready
export const contactFormSchema = z.object({
  name: z.string()
    .trim()
    .min(1, { message: "Name is required" })
    .max(100, { message: "Name must be less than 100 characters" })
    .regex(/^[a-zA-Z\s]+$/, { message: "Name can only contain letters and spaces" }),
  
  email: z.string()
    .trim()
    .min(1, { message: "Email is required" })
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  
  phone: z.string()
    .trim()
    .regex(/^[+]?[1-9]\d{1,14}$/, { message: "Invalid phone number format" })
    .optional(),
  
  message: z.string()
    .trim()
    .min(10, { message: "Message must be at least 10 characters" })
    .max(1000, { message: "Message must be less than 1000 characters" })
});

// Product Schemas
export const productSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000),
  price: z.number().min(0),
  category: z.string(),
  vendorId: z.string().uuid(),
  images: z.array(z.string().url()).min(1),
  isCustomizable: z.boolean(),
  minQuantity: z.number().min(1).optional(),
  maxQuantity: z.number().min(1).optional(),
});

// Order Schemas
export const orderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().min(1),
  customization: z.object({
    design: z.string().url().optional(),
    message: z.string().max(500).optional(),
    specialInstructions: z.string().max(1000).optional()
  }).optional()
});

export const orderSchema = z.object({
  items: z.array(orderItemSchema),
  deliveryAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().regex(/^\d{6}$/),
    phone: z.string().regex(/^[+]?[1-9]\d{1,14}$/)
  }),
  paymentMethod: z.enum(['upi', 'card', 'netbanking', 'wallet']),
  notes: z.string().max(500).optional()
});

// User Profile Schema
export const userProfileSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^[+]?[1-9]\d{1,14}$/),
  avatar: z.string().url().optional(),
  addresses: z.array(z.object({
    id: z.string().uuid(),
    type: z.enum(['home', 'office', 'other']),
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().regex(/^\d{6}$/),
    isDefault: z.boolean()
  }))
});

// Export types
export type ContactForm = z.infer<typeof contactFormSchema>;
export type Product = z.infer<typeof productSchema>;
export type Order = z.infer<typeof orderSchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;