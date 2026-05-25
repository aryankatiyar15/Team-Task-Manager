import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id format");

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  password: z.string().min(8).max(100),
  role: z.enum(["Admin", "Member"]).optional()
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1)
});

export const projectCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional().default(""),
  memberIds: z.array(objectId).optional().default([])
});

export const projectUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(1000).optional()
});

export const memberSchema = z.object({
  userId: objectId
});

export const taskCreateSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).optional().default(""),
  projectId: objectId,
  assigneeId: objectId,
  dueDate: z.coerce.date(),
  priority: z.enum(["Low", "Medium", "High"]).optional().default("Medium"),
  status: z.enum(["To Do", "In Progress", "Done"]).optional().default("To Do")
});

export const taskUpdateSchema = z.object({
  title: z.string().trim().min(2).max(160).optional(),
  description: z.string().trim().max(2000).optional(),
  assigneeId: objectId.optional(),
  dueDate: z.coerce.date().optional(),
  priority: z.enum(["Low", "Medium", "High"]).optional(),
  status: z.enum(["To Do", "In Progress", "Done"]).optional()
});

export const taskStatusSchema = z.object({
  status: z.enum(["To Do", "In Progress", "Done"])
});
