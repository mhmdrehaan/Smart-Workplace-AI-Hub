"use client"

import { Line, LineChart } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"

interface Props {
  failedCount: number
  total: number
  chartData: { day: string; value: number }[]
}

const chartConfig = {
  value: {
    label: "Failed",
    color: "var(--destructive)",
  },
} satisfies ChartConfig

export default function FailedIncidents({ failedCount, total, chartData }: Props) {
  const failRate =
    total > 0 ? ((failedCount / total) * 100).toFixed(1) : "0.0"

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-normal">Failed Incidents</CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%_-_52px)] pb-0">
        <div className="text-2xl font-bold text-destructive">
          {failedCount.toLocaleString("en-US")}
        </div>
        <p className="text-muted-foreground text-xs">
          {failRate}% failure rate this week
        </p>
        <ChartContainer config={chartConfig} className="h-[80px] w-full">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
          >
            <Line
              type="monotone"
              strokeWidth={2}
              dataKey="value"
              stroke="var(--color-value)"
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
