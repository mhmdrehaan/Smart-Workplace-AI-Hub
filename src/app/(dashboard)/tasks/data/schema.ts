import { z } from "zod"

export const taskSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable().optional(),
  status: z.string(),
  assignee_id: z.string().uuid().nullable().optional(),
  due_date: z.string().nullable().optional(),
  workspace_id: z.string().uuid().nullable().optional(),
  created_at: z.string(),
})

export type Task = z.infer<typeof taskSchema>

// Skema untuk memparsing list data array dari Supabase
export const taskListSchema = z.array(taskSchema)
