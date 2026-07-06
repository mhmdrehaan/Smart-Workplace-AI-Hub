"use client"

import { Bar, BarChart, XAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface Props {
  data: { source: string; success: number; failed: number }[]
}

const chartConfig = {
  success: {
    label: "Success",
    color: "var(--chart-2)",
  },
  failed: {
    label: "Failed",
    color: "var(--destructive)",
  },
} satisfies ChartConfig

export default function AgentBreakdown({ data }: Props) {
  const total = data.reduce((s, d) => s + d.success + d.failed, 0)

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-normal">Agent Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="h-full">
        <div className="text-2xl font-bold">{total.toLocaleString("en-US")}</div>
        <p className="text-muted-foreground text-xs">
          Success vs failures by automation source
        </p>
        <ChartContainer
          config={chartConfig}
          className="mt-4 h-[calc(100%_-_80px)] max-h-[205px] w-full"
        >
          <BarChart data={data}>
            <XAxis
              dataKey="source"
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="success"
              fill="var(--color-success)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="failed"
              fill="var(--color-failed)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
