/**
 * @file src/app/api/tasks/route.ts
 * @description Next.js App Router API Route Handler for task CRUD operations.
 *
 * POST /api/tasks
 *   - Inserts a new task into the Supabase `tasks` table.
 *   - Fires a WhatsApp notification (via Green-API) in the background WITHOUT
 *     blocking the HTTP response, using the "fire-and-forget" pattern.
 *
 * GET /api/tasks
 *   - Returns all tasks ordered by creation date (newest first).
 */

import { NextResponse } from "next/server"
import { createClient as createSupabaseServerClient } from "@supabase/supabase-js"
import { sendTaskNotification } from "@/lib/whatsapp"

// ─── Supabase Admin Client ────────────────────────────────────────────────────
// Uses the service-role key so the route has unrestricted write access.
// This client must NEVER be exposed to the browser.
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      "[Tasks API] Missing Supabase environment variables. " +
        "Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local."
    )
  }

  return createSupabaseServerClient(url, serviceKey, {
    auth: { persistSession: false },
  })
}

// ─── Types ───────────────────────────────────────────────────────────────────

/** Validated body shape expected in POST /api/tasks */
interface CreateTaskBody {
  title: string
  description?: string | null
  status: string
  assignee_id?: string | null
  assignee_name?: string | null   // Used for the WhatsApp notification display name
  assignee_phone?: string | null  // WhatsApp recipient; optional - skips WA if absent
  due_date?: string | null
  workspace_id?: string | null
}

// ─── POST /api/tasks ─────────────────────────────────────────────────────────

/**
 * Creates a new task in Supabase and, if the assignee's phone number is
 * provided, fires a WhatsApp notification in the background.
 *
 * Request body (JSON):
 * ```json
 * {
 *   "title":          "Prepare Q3 financial report",
 *   "description":    "Include charts and KPIs",
 *   "status":         "Todo",
 *   "assignee_id":    "uuid-of-user",
 *   "assignee_name":  "Rehaan",
 *   "assignee_phone": "6283804064832",
 *   "due_date":       "2026-08-01",
 *   "workspace_id":   "uuid-of-workspace"
 * }
 * ```
 */
export async function POST(req: Request): Promise<NextResponse> {
  // ── 1. Parse request body ────────────────────────────────────────────────
  let body: CreateTaskBody

  try {
    body = (await req.json()) as CreateTaskBody
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body." },
      { status: 400 }
    )
  }

  // ── 2. Basic validation ──────────────────────────────────────────────────
  if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json(
      { success: false, error: "Field `title` is required and must be a non-empty string." },
      { status: 422 }
    )
  }

  if (!body.status || typeof body.status !== "string") {
    return NextResponse.json(
      { success: false, error: "Field `status` is required." },
      { status: 422 }
    )
  }

  // ── 3. Insert task into Supabase ─────────────────────────────────────────
  let insertedTask: { id: string; title: string; due_date: string | null }

  try {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        title:        body.title.trim(),
        description:  body.description  ?? null,
        status:       body.status,
        assignee_id:  body.assignee_id  ?? null,
        due_date:     body.due_date     ?? null,
        workspace_id: body.workspace_id ?? null,
      })
      .select("id, title, due_date")
      .single()

    if (error) {
      console.error("[Tasks API] Supabase insert error:", error.message)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    insertedTask = data as typeof insertedTask
    console.log(`[Tasks API] ✅ Task created — id: ${insertedTask.id}, title: "${insertedTask.title}"`)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[Tasks API] Unexpected error during insert:", message)
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    )
  }

  // ── 4. Fire-and-forget WhatsApp notification ─────────────────────────────
  //
  // We intentionally do NOT await this promise so the HTTP response is
  // returned immediately to the client. The notification runs in the background.
  // Any failure is caught inside the .catch() handler and logged to the terminal.
  //
  if (body.assignee_phone) {
    const notificationPayload = {
      toPhone:      body.assignee_phone,
      taskName:     insertedTask.title,
      deadline:     insertedTask.due_date ?? "No deadline set",
      assigneeName: body.assignee_name ?? "Team Member",
    }

    sendTaskNotification(notificationPayload)
      .then((messageId) => {
        console.log(
          `[WhatsApp] ✅ Notification sent — recipient: ${body.assignee_phone}, ` +
          `task: "${insertedTask.title}", idMessage: ${messageId}`
        )
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err)
        console.error(
          `[WhatsApp] ❌ Notification FAILED — recipient: ${body.assignee_phone}, ` +
          `task: "${insertedTask.title}", reason: ${message}`
        )
      })
  } else {
    console.log(
      `[Tasks API] ℹ️ Skipping WhatsApp notification — no assignee_phone provided for task: "${insertedTask.title}"`
    )
  }

  // ── 5. Return success response ───────────────────────────────────────────
  return NextResponse.json(
    {
      success: true,
      message: "Task created successfully.",
      task: insertedTask,
    },
    { status: 201 }
  )
}

// ─── GET /api/tasks ───────────────────────────────────────────────────────────

/**
 * Returns all tasks from Supabase ordered newest-first.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[Tasks API] Supabase fetch error:", error.message)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, tasks: data }, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[Tasks API] Unexpected error during fetch:", message)
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    )
  }
}
