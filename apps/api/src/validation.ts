import { z } from 'zod';

export const categories = ['Scholarship', 'Concert', 'Admission', 'General Query'] as const;
export const userTypes = ['Parent', 'Student', 'School'] as const;
export const statuses = ['New', 'In Progress', 'Resolved'] as const;
export const inquirySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(7).max(30),
  userType: z.enum(userTypes),
  category: z.enum(categories),
  message: z.string().trim().min(10).max(3000),
});
export const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});
