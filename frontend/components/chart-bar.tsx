"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { isLastItem, formatCycleProgress, getThresholdData, useCycleData, calculateCycleProgress } from "./chart-utils"
import { useViewport } from "@/hooks/use-viewport"

const chartConfig = {
  threshold: {
    label: "Threshold",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function ChartBar() {
  const { isMobile } = useViewport()
  const { data, currentBlockHeight, loading, error } = useCycleData()

  // Get the last cycle and calculate progress
  const lastCycle = data.length > 0 ? data[data.length - 1] : null
  const lastCycleProgress = calculateCycleProgress(lastCycle, currentBlockHeight)
  const lastCycleAlpha = Math.max(0.3, lastCycleProgress) // Minimum alpha of 0.3 for visibility

  const chartData = getThresholdData(data, isMobile)

  return (
    <Card className="card border-0 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <span className="text-primary">⚡</span> Threshold Values
        </CardTitle>
        <CardDescription>
          {isMobile ? "Last 3 cycles" : "Last 20 cycles"} with threshold changes
          {lastCycle &&
            currentBlockHeight &&
            currentBlockHeight < lastCycle.cycleRewardsEnd + 100 &&
            " (last cycle in progress)"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-[300px] text-destructive">
            <p>Error loading data: {error}</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px]">
            <p>No data available</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig}>
            <BarChart
              accessibilityLayer
              data={chartData}
              margin={{
                left: 12,
                right: 12,
                top: 12,
                bottom: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis dataKey="cycle" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                tickFormatter={(value) => `${value.toLocaleString()} STX`}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip
                cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                content={
                  <ChartTooltipContent
                    formatter={(value, name, props) => {
                      const isLast =
                        props.dataKey &&
                        props.payload &&
                        isLastItem(props.payload, chartData.indexOf(props.payload), chartData)

                      const formattedValue = `${(value as number).toLocaleString()} STX`

                      if (isLast && lastCycleProgress < 1) {
                        return `${formattedValue} (${Math.round(lastCycleProgress * 100)}% complete)`
                      }

                      return formattedValue
                    }}
                  />
                }
              />
              <Bar
                dataKey="threshold"
                fill="hsl(var(--chart-1))"
                radius={[4, 4, 0, 0]}
                fillOpacity={(data, index) =>
                  index === chartData.length - 1 && lastCycleProgress < 1 ? lastCycleAlpha : 1
                }
                activeBar={{
                  fill: "hsl(var(--chart-1))",
                  fillOpacity: 0.9,
                  stroke: "hsl(var(--background))",
                  strokeWidth: 2,
                }}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="pt-4">
        <div className="flex flex-col items-start gap-2 text-sm">
          <div className="flex gap-2 font-medium leading-none">
            {!loading && chartData.length > 0 && (
              <>
                Threshold increased to {chartData[chartData.length - 1]?.threshold.toLocaleString()} STX{" "}
                <TrendingUp className="h-4 w-4 text-primary" />
              </>
            )}
          </div>
          <div className="leading-none text-muted-foreground">
            {loading ? (
              <span className="animate-pulse">Loading data...</span>
            ) : lastCycle && currentBlockHeight ? (
              <>Last cycle is {formatCycleProgress(lastCycle, currentBlockHeight)}</>
            ) : (
              "No data available"
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

