import { z } from 'zod'

// Auth Validations
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
})

// Onboarding Validations
export const businessInfoSchema = z.object({
  businessName: z.string().min(2, 'Required'),
  businessNameRw: z.string().optional(),
  businessType: z.string().min(1, 'Required'),
  description: z.string().optional(),
  descriptionRw: z.string().optional(),
})

export const businessMediaSchema = z.object({
  logoUrl: z.string().url().optional().or(z.literal('')),
  coverUrl: z.string().url().optional().or(z.literal('')),
})

export const businessLocationSchema = z.object({
  address: z.string().min(3, 'Address is required'),
  addressRw: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  deliveryRange: z.number().min(1).max(50).default(5),
})

export const businessContactSchema = z.object({
  businessPhone: z.string().min(10, 'Valid phone number required'),
  whatsappNumber: z.string().optional(),
  businessHours: z.record(z.object({
    open: z.string(),
    close: z.string(),
    closed: z.boolean(),
  })).optional(),
})

// Menu Validations
export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  nameRw: z.string().optional(),
  description: z.string().optional(),
  descriptionRw: z.string().optional(),
})

export const menuItemSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  name: z.string().min(1, 'Item name is required'),
  nameRw: z.string().optional(),
  description: z.string().optional(),
  descriptionRw: z.string().optional(),
  price: z.number().positive('Price must be greater than 0'),
  imageUrl: z.string().url().optional().or(z.literal('')),
  isAvailable: z.boolean().default(true),
})

// Order Validations
export const checkoutSchema = z.object({
  customerName: z.string().min(2, 'Name is required'),
  customerPhone: z.string().min(10, 'Valid phone number required'),
  customerEmail: z.string().email().optional().or(z.literal('')),
  deliveryType: z.enum(['delivery', 'pickup']),
  deliveryAddress: z.string().optional(),
  deliveryNotes: z.string().optional(),
})

export const updateOrderStatusSchema = z.object({
  status: z.enum(['new', 'preparing', 'ready', 'completed', 'cancelled']),
})

// Profile Validations
export const updateVendorProfileSchema = z.object({
  businessName: z.string().min(2, 'Required').optional(),
  businessNameRw: z.string().optional(),
  businessType: z.string().optional(),
  description: z.string().optional(),
  descriptionRw: z.string().optional(),
  address: z.string().optional(),
  addressRw: z.string().optional(),
  businessPhone: z.string().min(10).optional(),
  whatsappNumber: z.string().optional(),
  deliveryRange: z.number().min(1).max(50).optional(),
  isOnline: z.boolean().optional(),
  businessHours: z.record(z.object({
    open: z.string(),
    close: z.string(),
    closed: z.boolean(),
  })).optional(),
})

// Types derived from schemas
export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type BusinessInfoInput = z.infer<typeof businessInfoSchema>
export type BusinessMediaInput = z.infer<typeof businessMediaSchema>
export type BusinessLocationInput = z.infer<typeof businessLocationSchema>
export type BusinessContactInput = z.infer<typeof businessContactSchema>
export type CategoryInput = z.infer<typeof categorySchema>
export type MenuItemInput = z.infer<typeof menuItemSchema>
export type CheckoutInput = z.infer<typeof checkoutSchema>
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>
export type UpdateVendorProfileInput = z.infer<typeof updateVendorProfileSchema>
