"use client"

import { TrendingUp } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { isLastItem, formatCycleProgress, getCyclesData, useCycleData, calculateCycleProgress } from "./chart-utils"
import { useViewport } from "@/hooks/use-viewport"

const chartConfig = {
  stackedUsd: {
    label: "Stacked USD",
    color: "hsl(var(--chart-1))",
  },
  rewardsUsd: {
    label: "Rewards USD",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function ChartLine() {
  const { isMobile } = useViewport()
  const { data, currentBlockHeight, loading, error } = useCycleData()

  // Get the last cycle and calculate progress
  const lastCycle = data.length > 0 ? data[data.length - 1] : null
  const lastCycleProgress = calculateCycleProgress(lastCycle, currentBlockHeight)
  const lastCycleAlpha = Math.max(0.3, lastCycleProgress) // Minimum alpha of 0.3 for visibility

  const chartData = getCyclesData(data, isMobile)

  // Calculate max values for scaling
  const maxStackedUsd = Math.max(...chartData.map((item) => item.stackedUsd || 0), 1)
  const maxRewardsUsd = Math.max(...chartData.map((item) => item.rewardsUsd || 0), 1)

  return (
    <Card className="card border-0 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <span className="text-primary">$</span> Stacked USD & Rewards
        </CardTitle>
        <CardDescription>
          {isMobile ? "Last 3 cycles" : `Last ${Math.min(20, chartData.length)} cycles`}
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
            <LineChart
              accessibilityLayer
              data={chartData}
              margin={{
                left: 12,
                right: 40,
                top: 12,
                bottom: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis dataKey="cycleLabel" tickLine={false} axisLine={false} tickMargin={8} />
              {/* Left Y-axis for stackedUsd */}
              <YAxis
                yAxisId="left"
                orientation="left"
                tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                domain={[0, maxStackedUsd * 1.1]}
              />
              {/* Right Y-axis for rewardsUsd */}
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                domain={[0, maxRewardsUsd * 1.1]} // Add 10% padding
              />
              <ChartTooltip
                cursor={{ stroke: "rgba(255, 255, 255, 0.2)", strokeWidth: 1 }}
                content={
                  <ChartTooltipContent
                    formatter={(value, name, props) => {
                      const isLast =
                        props.dataKey &&
                        props.payload &&
                        isLastItem(props.payload, chartData.indexOf(props.payload), chartData)

                      let formattedValue
                      if (name === "stackedUsd") {
                        formattedValue = `$${((value as number) / 1000000).toFixed(2)}M`
                      } else {
                        formattedValue = `$${((value as number) / 1000).toFixed(2)}K`
                      }

                      if (isLast && lastCycleProgress < 1) {
                        return `${formattedValue} (${Math.round(lastCycleProgress * 100)}% complete)`
                      }

                      return formattedValue
                    }}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                dataKey="stackedUsd"
                type="monotone"
                stroke="hsl(var(--chart-1))"
                strokeWidth={3}
                activeDot={{ r: 6, fill: "hsl(var(--chart-1))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                dot={(props) => {
                  const { cx, cy, index } = props
                  const isLast = index === chartData.length - 1
                  const opacity = isLast && lastCycleProgress < 1 ? lastCycleAlpha : 1
                  return <circle cx={cx} cy={cy} r={4} fill="hsl(var(--chart-1))" opacity={opacity} />
                }}
                yAxisId="left"
              />
              <Line
                dataKey="rewardsUsd"
                type="monotone"
                stroke="hsl(var(--chart-2))"
                strokeWidth={3}
                activeDot={{ r: 6, fill: "hsl(var(--chart-2))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                dot={(props) => {
                  const { cx, cy, index } = props
                  const isLast = index === chartData.length - 1
                  const opacity = isLast && lastCycleProgress < 1 ? lastCycleAlpha : 1
                  return <circle cx={cx} cy={cy} r={4} fill="hsl(var(--chart-2))" opacity={opacity} />
                }}
                yAxisId="right"
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="pt-4">
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
              {!loading && chartData.length > 0 && (
                <>
                  Peak stacked value of ${(Math.max(...chartData.map((item) => item.stackedUsd)) / 1000000).toFixed(1)}B
                  in cycle #
                  {
                    chartData.find((item) => item.stackedUsd === Math.max(...chartData.map((item) => item.stackedUsd)))
                      ?.cycle
                  }{" "}
                  <TrendingUp className="h-4 w-4 text-primary" />
                </>
              )}
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              {loading ? (
                <span className="animate-pulse">Loading data...</span>
              ) : lastCycle && currentBlockHeight ? (
                <>
                  Last cycle ({lastCycle.cycle}) is {formatCycleProgress(lastCycle, currentBlockHeight)}
                </>
              ) : (
                "No data available"
              )}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

