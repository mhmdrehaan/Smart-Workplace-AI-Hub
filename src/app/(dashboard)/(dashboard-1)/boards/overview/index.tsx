
import { createClient } from "@/lib/supabase/server"
import { WebhookLog, AutomationStat, fallbackWebhookLogs } from "./data/data"
import Stats from "./components/stats"
import RequestVolume from "./components/sales"
import AgentBreakdown from "./components/subscriptions"
import FailedIncidents from "./components/total-revenue"
import WebhookLogsTable from "./components/payments"

// ─── Helper: group logs by date label for the area chart ─────────────────────
function buildDailyVolume(
  logs: WebhookLog[]
): { day: string; success: number; failed: number }[] {
  const map = new Map<string, { success: number; failed: number }>()

  // Seed last 7 days
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toLocaleDateString("en-US", { weekday: "short" })
    map.set(key, { success: 0, failed: 0 })
  }

  logs.forEach((log) => {
    const d = new Date(log.created_at)
    const key = d.toLocaleDateString("en-US", { weekday: "short" })
    if (map.has(key)) {
      const entry = map.get(key)!
      if (log.status === "success" || log.status_code < 400) {
        entry.success += 1
      } else {
        entry.failed += 1
      }
    }
  })

  return Array.from(map.entries()).map(([day, v]) => ({ day, ...v }))
}

// ─── Helper: group logs by webhook_source for the bar chart ──────────────────
function buildAgentBreakdown(
  logs: WebhookLog[]
): { source: string; success: number; failed: number }[] {
  const map = new Map<string, { success: number; failed: number }>()

  logs.forEach((log) => {
    const src = log.webhook_source ?? "unknown"
    if (!map.has(src)) map.set(src, { success: 0, failed: 0 })
    const entry = map.get(src)!
    if (log.status === "success" || log.status_code < 400) {
      entry.success += 1
    } else {
      entry.failed += 1
    }
  })

  return Array.from(map.entries()).map(([source, v]) => ({ source, ...v }))
}

export default async function Overview() {
  const supabase = await createClient()

  let logs: WebhookLog[] = []
  let usingFallback = false

  try {
    const { data, error } = await supabase
      .from("webhook_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)

    if (error) throw error
    logs = (data as WebhookLog[]) ?? []
  } catch {
    // Table doesn't exist yet or network error — use graceful fallback
    logs = fallbackWebhookLogs
    usingFallback = true
  }

  // ── Metrics ──────────────────────────────────────────────────────────────
  const total = logs.length
  const successCount = logs.filter(
    (l) => l.status === "success" || l.status_code < 400
  ).length
  const failedCount = logs.filter(
    (l) => l.status === "failed" || l.status_code >= 400
  ).length
  const successRate =
    total > 0 ? ((successCount / total) * 100).toFixed(1) : "0.0"

  // Mini-sparkline data for each stat card (last 7 days total volume)
  const dailyVolume = buildDailyVolume(logs)
  const sparklineTotal = dailyVolume.map((d) => ({
    day: d.day,
    value: d.success + d.failed,
  }))
  const sparklineSuccess = dailyVolume.map((d) => ({
    day: d.day,
    value: d.success,
  }))
  const sparklineFailed = dailyVolume.map((d) => ({
    day: d.day,
    value: d.failed,
  }))
  const sparklineRate = dailyVolume.map((d) => ({
    day: d.day,
    value:
      d.success + d.failed > 0
        ? Math.round((d.success / (d.success + d.failed)) * 100)
        : 0,
  }))

  const automationStats: AutomationStat[] = [
    {
      label: "Total Webhooks",
      description: "Total automated webhook calls logged in the system",
      value: total.toLocaleString("en-US"),
      type: "up",
      percentage: 12.4,
      chartData: sparklineTotal,
      strokeColor: "var(--chart-1)",
    },
    {
      label: "Successful Tasks",
      description: "Webhook calls that returned a 2xx status code",
      value: successCount.toLocaleString("en-US"),
      type: "up",
      percentage: 8.7,
      chartData: sparklineSuccess,
      strokeColor: "var(--chart-2)",
    },
    {
      label: "Success Rate",
      description: "Percentage of successful webhooks vs total",
      value: `${successRate}%`,
      type: Number(successRate) >= 80 ? "up" : "down",
      percentage: Number(successRate),
      chartData: sparklineRate,
      strokeColor: "#6366f1",
    },
    {
      label: "Failed Incidents",
      description: "Webhook calls that returned a 4xx or 5xx status code",
      value: failedCount.toLocaleString("en-US"),
      type: failedCount === 0 ? "up" : "down",
      percentage: total > 0 ? Math.round((failedCount / total) * 100) : 0,
      chartData: sparklineFailed,
      strokeColor: "var(--destructive)",
    },
  ]

  const agentBreakdown = buildAgentBreakdown(logs)

  return (
    <div className="space-y-5">
      {usingFallback && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          ⚠️ <strong>Demo mode:</strong> Supabase <code>webhook_logs</code>{" "}
          table not found. Showing sample data. Run the SQL migration to connect
          live data.
        </div>
      )}

      <div className="grid auto-rows-auto grid-cols-3 gap-5 md:grid-cols-6 lg:grid-cols-9">
        {/* 4 Stat Cards */}
        <Stats stats={automationStats} />

        {/* Failed Incidents sparkline card */}
        <div className="col-span-3">
          <FailedIncidents
            failedCount={failedCount}
            total={total}
            chartData={sparklineFailed}
          />
        </div>

        {/* Request Volume area chart */}
        <div className="col-span-3 md:col-span-6">
          <RequestVolume chartData={dailyVolume} />
        </div>

        {/* Agent Breakdown bar chart */}
        <div className="col-span-3 md:col-span-6 lg:col-span-3">
          <AgentBreakdown data={agentBreakdown} />
        </div>

        {/* Webhook Logs table — full width */}
        <div className="col-span-3 md:col-span-6 lg:col-span-9">
          <WebhookLogsTable logs={logs.slice(0, 50)} />
        </div>
      </div>
    </div>
  )
}
