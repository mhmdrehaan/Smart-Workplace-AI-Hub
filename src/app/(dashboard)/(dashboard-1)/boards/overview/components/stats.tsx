"use client"

import * as React from "react"
import {
  IconActivity,
  IconAlertTriangle,
  IconCaretDownFilled,
  IconCaretUpFilled,
  IconCheck,
  IconInfoCircle,
  IconWebhook,
} from "@tabler/icons-react"
import { Line, LineChart } from "recharts"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { AutomationStat } from "../data/data"

// Icons resolved locally — React component functions cannot be serialized
// as props across the server→client boundary.
const ICON_MAP: Record<string, React.ElementType> = {
  "Total Webhooks":   IconWebhook,
  "Successful Tasks": IconCheck,
  "Success Rate":     IconActivity,
  "Failed Incidents": IconAlertTriangle,
}

interface Props {
  stats: AutomationStat[]
}

export default function Stats({ stats }: Props) {
  return (
    <>
      {stats.map((s) => (
        <StatCard key={s.label} {...s} />
      ))}
    </>
  )
}

function StatCard({
  label,
  description,
  value,
  type,
  percentage,
  chartData,
  strokeColor,
}: AutomationStat) {
  const Icon = ICON_MAP[label] ?? IconWebhook
  const chartConfig = {
    value: {
      label: label,
      color: strokeColor,
    },
  } satisfies ChartConfig

  return (
    <Card className="col-span-3 h-full lg:col-span-2 xl:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between gap-5 space-y-0 pt-4 pb-2">
        <CardTitle className="flex items-center gap-2 truncate text-sm font-medium">
          <Icon size={16} />
          {label}
        </CardTitle>
        <TooltipProvider>
          <Tooltip delayDuration={50}>
            <TooltipTrigger>
              <IconInfoCircle className="text-muted-foreground scale-90 stroke-[1.25]" />
              <span className="sr-only">More Info</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent className="flex h-[calc(100%_-_48px)] flex-col justify-between py-4">
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="text-3xl font-bold">{value}</div>
            <ChartContainer className="w-[70px]" config={chartConfig}>
              <LineChart accessibilityLayer data={chartData}>
                <Line
                  dataKey="value"
                  type="linear"
                  stroke="var(--color-value)"
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </div>
          <p className="text-muted-foreground text-xs">Since last week</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="text-sm font-semibold">Details</div>
          <div
            className={cn("flex items-center gap-1", {
              "text-emerald-500 dark:text-emerald-400": type === "up",
              "text-red-500 dark:text-red-400": type === "down",
              "text-muted-foreground": type === "neutral",
            })}
          >
            <p className="text-[13px] leading-none font-medium">
              {percentage.toLocaleString("en-US")}%
            </p>
            {type === "up" ? (
              <IconCaretUpFilled size={18} />
            ) : type === "down" ? (
              <IconCaretDownFilled size={18} />
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
