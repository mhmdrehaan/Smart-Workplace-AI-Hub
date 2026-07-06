import { ForwardRefExoticComponent, RefAttributes } from "react"
import { Icon, IconProps } from "@tabler/icons-react"

// ─── Webhook Log row shape (mirrors the Supabase table) ──────────────────────
export type WebhookLog = {
  id: string
  webhook_source: string
  status_code: number
  status: "success" | "failed" | "pending"
  error_message: string | null
  created_at: string
}

// ─── Stat card props ──────────────────────────────────────────────────────────
export type AutomationStat = {
  label: string
  description: string
  /** Displayed value — can be a number string or a formatted % string */
  value: string
  type: "up" | "down" | "neutral"
  percentage: number
  chartData: { day: string; value: number }[]
  strokeColor: string
  icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>
}

// ─── Fallback sample data (used when the DB table doesn't exist yet) ──────────
export const fallbackWebhookLogs: WebhookLog[] = [
  {
    id: "wh-001",
    webhook_source: "n8n",
    status_code: 200,
    status: "success",
    error_message: null,
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "wh-002",
    webhook_source: "zapier",
    status_code: 200,
    status: "success",
    error_message: null,
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "wh-003",
    webhook_source: "make",
    status_code: 422,
    status: "failed",
    error_message: "Unprocessable entity – missing required field",
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "wh-004",
    webhook_source: "n8n",
    status_code: 200,
    status: "success",
    error_message: null,
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "wh-005",
    webhook_source: "zapier",
    status_code: 500,
    status: "failed",
    error_message: "Internal server error",
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "wh-006",
    webhook_source: "custom",
    status_code: 200,
    status: "success",
    error_message: null,
    created_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "wh-007",
    webhook_source: "make",
    status_code: 200,
    status: "success",
    error_message: null,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "wh-008",
    webhook_source: "n8n",
    status_code: 404,
    status: "failed",
    error_message: "Endpoint not found",
    created_at: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "wh-009",
    webhook_source: "zapier",
    status_code: 200,
    status: "success",
    error_message: null,
    created_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "wh-010",
    webhook_source: "custom",
    status_code: 200,
    status: "success",
    error_message: null,
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
]
