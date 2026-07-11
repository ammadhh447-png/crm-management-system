const { z } = require('zod');

const registerSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(1, 'First name is required'),
    lastName: z.string().trim().optional().default(''),
    phone: z.string().trim().optional(),
    department: z.string().trim().optional(),
    role: z.enum(['admin', 'manager', 'sales_rep', 'support', 'hr']).optional(),
  }),
});

const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(1).optional(),
    lastName: z.string().trim().min(1).optional(),
    phone: z.string().trim().optional(),
    avatar: z.string().url('Avatar must be a valid URL').optional().or(z.literal('')),
    department: z.string().trim().optional(),
  }),
});

const mongoIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID'),
  }),
});

module.exports = { registerSchema, updateProfileSchema, mongoIdSchema };
