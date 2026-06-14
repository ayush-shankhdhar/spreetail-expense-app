import { z } from "zod";

// ──────────────────────────────────────────
// Auth Schemas
// ──────────────────────────────────────────

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ──────────────────────────────────────────
// Group Schemas
// ──────────────────────────────────────────

export const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required").max(100),
});

export const updateGroupSchema = z.object({
  name: z.string().min(1, "Group name is required").max(100),
});

export const addMemberSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  joinDate: z.string().min(1, "Join date is required"),
});

export const updateMemberSchema = z.object({
  leaveDate: z.string().nullable(),
});

// ──────────────────────────────────────────
// Expense Schemas
// ──────────────────────────────────────────

export const splitParticipantSchema = z.object({
  userId: z.string().min(1),
  shareAmount: z.number().min(0),
});

export const createExpenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.number().positive("Amount must be positive"),
  currency: z.enum(["INR", "USD"]).default("INR"),
  expenseDate: z.string().min(1, "Date is required"),
  paidById: z.string().min(1, "Payer is required"),
  groupId: z.string().min(1, "Group is required"),
  splitType: z.enum(["equal", "percentage", "share", "unequal"]),
  notes: z.string().optional(),
  participants: z.array(splitParticipantSchema).min(1, "At least one participant required"),
});

export const updateExpenseSchema = createExpenseSchema.partial();

// ──────────────────────────────────────────
// Settlement Schemas
// ──────────────────────────────────────────

export const createSettlementSchema = z.object({
  payerId: z.string().min(1, "Payer is required"),
  receiverId: z.string().min(1, "Receiver is required"),
  groupId: z.string().min(1, "Group is required"),
  amount: z.number().positive("Amount must be positive"),
  date: z.string().optional(),
});

// ──────────────────────────────────────────
// CSV Import Schemas
// ──────────────────────────────────────────

export const csvRowSchema = z.object({
  date: z.string(),
  description: z.string(),
  paid_by: z.string(),
  amount: z.string(),
  currency: z.string(),
  split_type: z.string(),
  split_with: z.string(),
  split_details: z.string(),
  notes: z.string(),
});

// ──────────────────────────────────────────
// Type Exports
// ──────────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;
