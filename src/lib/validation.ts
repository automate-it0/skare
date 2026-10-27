// Validation utilities - all user input is sanitized here
import { z } from "zod";

export const emailSchema = z.string().email().max(254).toLowerCase().trim();
export const passwordSchema = z.string().min(8).max(128);
export const phoneSchema = z.string().regex(/^(010|011|012|015)\d{8}$/);
export const nameSchema = z.string().min(1).max(200).trim();
export const addressSchema = z.string().min(3).max(500).trim();
export const priceSchema = z.number().min(0).max(1_000_000);
export const discountSchema = z.number().int().min(1).max(100);

export const productNameSchema = z.string().min(1).max(200).trim();
export const productDescSchema = z.string().max(5000).trim().optional();
export const categoryNameSchema = z.string().min(1).max(100).trim();
export const couponCodeSchema = z
  .string()
  .min(3)
  .max(50)
  .regex(/^[A-Z0-9_-]+$/)
  .toUpperCase();

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: nameSchema,
  phone: phoneSchema,
  address: addressSchema,
});

export const productSchema = z.object({
  name: productNameSchema,
  description: productDescSchema,
  price: priceSchema,
  salePrice: priceSchema.nullable().optional(),
  imageUrl: z.string().url().max(2000).optional().or(z.literal("")),
  categoryId: z.string().cuid().optional().nullable(),
});

export const categorySchema = z.object({
  name: categoryNameSchema,
  parentId: z.string().cuid().optional().nullable(),
});

export const couponSchema = z.object({
  code: couponCodeSchema,
  discountPercentage: discountSchema,
  maxUsers: z.number().int().min(1).max(1_000_000),
  usesPerUser: z.number().int().min(1).max(1000),
  isActive: z.boolean(),
  expiresAt: z.string().datetime().optional().nullable(),
});

export const orderSchema = z.object({
  shippingName: nameSchema,
  shippingPhone: phoneSchema,
  shippingCity: z.string().min(1).max(100),
  shippingAddress: addressSchema,
  couponCode: z.string().max(50).optional().nullable(),
});

export const orderStatusSchema = z.enum([
  "NEW",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
]);

/** Strip HTML tags from any string (defense-in-depth against XSS in stored data) */
export function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, "").trim();
}
