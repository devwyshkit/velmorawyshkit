import { z } from "zod";

/**
 * Bulk Pricing Validation Schema
 * Ensures tiers are properly configured with no overlaps
 */

export const bulkTierSchema = z.object({
  minQty: z.number().min(1, "Minimum quantity must be at least 1"),
  maxQty: z.number().optional(),
  price: z.number().min(1, "Price must be greater than 0"),
  discountPercent: z.number().min(0).max(100),
});

export const bulkPricingSchema = z.array(bulkTierSchema).refine(
  (tiers) => {
    // Check ascending quantities
    for (let i = 0; i < tiers.length - 1; i++) {
      if (tiers[i].minQty >= tiers[i + 1].minQty) {
        return false;
      }
    }
    return true;
  },
  {
    message: "Tier quantities must be in ascending order",
  }
).refine(
  (tiers) => {
    // Check descending prices
    for (let i = 0; i < tiers.length - 1; i++) {
      if (tiers[i].price <= tiers[i + 1].price) {
        return false;
      }
    }
    return true;
  },
  {
    message: "Tier prices must decrease as quantity increases",
  }
).max(5, "Maximum 5 tiers allowed");

export type BulkTierFormData = z.infer<typeof bulkTierSchema>;

