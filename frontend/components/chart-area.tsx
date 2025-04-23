"use client"

import { TrendingUp, TrendingDown } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { isLastItem, formatCycleProgress, getAreaChartData, useCycleData, calculateCycleProgress } from "./chart-utils"
import { useViewport } from "@/hooks/use-viewport"

const chartConfig = {
  blockRewardsUsd: {
    label: "Block Rewards USD",
    color: "hsl(var(--chart-1))",
  },
  difference: {
    label: "Rewards - Block Rewards",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function ChartArea() {
  const { isMobile } = useViewport()
  const { data, currentBlockHeight, loading, error } = useCycleData()

  // Get the last cycle and calculate progress
  const lastCycle = data.length > 0 ? data[data.length - 1] : null
  const lastCycleProgress = calculateCycleProgress(lastCycle, currentBlockHeight)
  const lastCycleAlpha = Math.max(0.3, lastCycleProgress) // Minimum alpha of 0.3 for visibility

  const chartData = getAreaChartData(data, isMobile)

  // Find if the difference is mostly negative
  const mostlyNegative = chartData.filter((item) => item.difference < 0).length > chartData.length / 2

  return (
    <Card className="card border-0 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <span className="text-primary">📊</span> Rewards vs Block Rewards
        </CardTitle>
        <CardDescription>
          {isMobile ? "Last 3 cycles" : "Last 20 cycles"}
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
            <AreaChart
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
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
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

                      const formattedValue = `$${(value as number).toLocaleString()}`

                      if (isLast && lastCycleProgress < 1) {
                        return `${formattedValue} (${Math.round(lastCycleProgress * 100)}% complete)`
                      }

                      return formattedValue
                    }}
                  />
                }
              />
              <Area
                dataKey="blockRewardsUsd"
                type="monotone"
                fill="hsl(var(--chart-1))"
                fillOpacity={(data, index) =>
                  index === chartData.length - 1 && lastCycleProgress < 1 ? lastCycleAlpha * 0.4 : 0.4
                }
                stroke="hsl(var(--chart-1))"
                strokeOpacity={(data, index) =>
                  index === chartData.length - 1 && lastCycleProgress < 1 ? lastCycleAlpha : 1
                }
                activeDot={{ r: 6, fill: "hsl(var(--chart-1))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                stackId="a"
              />
              <Area
                dataKey="difference"
                type="monotone"
                fill="hsl(var(--chart-2))"
                fillOpacity={(data, index) =>
                  index === chartData.length - 1 && lastCycleProgress < 1 ? lastCycleAlpha * 0.4 : 0.4
                }
                stroke="hsl(var(--chart-2))"
                strokeOpacity={(data, index) =>
                  index === chartData.length - 1 && lastCycleProgress < 1 ? lastCycleAlpha : 1
                }
                activeDot={{ r: 6, fill: "hsl(var(--chart-2))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="pt-4">
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
              {!loading &&
                chartData.length > 0 &&
                (mostlyNegative ? (
                  <>
                    Rewards typically lower than block rewards <TrendingDown className="h-4 w-4 text-red-500" />
                  </>
                ) : (
                  <>
                    Rewards typically higher than block rewards <TrendingUp className="h-4 w-4 text-primary" />
                  </>
                ))}
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              {loading ? (
                <span className="animate-pulse">Loading data...</span>
              ) : lastCycle && currentBlockHeight ? (
                <>
                  Last cycle (#{chartData[chartData.length - 1]?.cycle}) is{" "}
                  {formatCycleProgress(lastCycle, currentBlockHeight)}
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

