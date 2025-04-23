"use client"

import { TrendingUp, TrendingDown } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { isLastItem, getValueIncreaseData, useCycleData, calculateCycleProgress } from "./chart-utils"
import { useViewport } from "@/hooks/use-viewport"

const chartConfig = {
  valueIncrease: {
    label: "Value Increase ($)",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function ChartValueIncrease() {
  const { isMobile } = useViewport()
  const { data, currentBlockHeight, loading, error } = useCycleData()

  // Get the last cycle and calculate progress
  const lastCycle = data.length > 0 ? data[data.length - 1] : null
  const lastCycleProgress = calculateCycleProgress(lastCycle, currentBlockHeight)
  const lastCycleAlpha = Math.max(0.3, lastCycleProgress) // Minimum alpha of 0.3 for visibility

  const chartData = getValueIncreaseData(data, isMobile)

  // Filter out the first cycle which has no value increase
  const firstCycle = chartData.length > 0 ? chartData[0]?.cycle : null
  const filteredData = chartData.filter((item) => item.cycle !== firstCycle || item.valueIncrease !== 0)

  // Calculate average value increase (excluding the first cycle)
  const avgValueIncrease =
    filteredData.length > 0 ? filteredData.reduce((sum, item) => sum + item.valueIncrease, 0) / filteredData.length : 0

  // Find max and min value increases
  const maxIncrease = filteredData.length > 0 ? Math.max(...filteredData.map((item) => item.valueIncrease)) : 0
  const minIncrease = filteredData.length > 0 ? Math.min(...filteredData.map((item) => item.valueIncrease)) : 0

  // Find cycles with max and min increases
  const maxCycle = filteredData.find((item) => item.valueIncrease === maxIncrease)?.cycle
  const minCycle = filteredData.find((item) => item.valueIncrease === minIncrease)?.cycle

  // Determine if overall trend is positive
  const isPositive = avgValueIncrease > 0

  return (
    <Card className="card border-0 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <span className="text-primary">💰</span> $1000 Investment Value Change
        </CardTitle>
        <CardDescription>
          {isMobile ? "Last 3 cycles" : "Last 20 cycles"} value change for $1000 investment
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
        ) : filteredData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px]">
            <p>No data available</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig}>
            <BarChart
              accessibilityLayer
              data={filteredData}
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
                tickFormatter={(value) => `$${value.toFixed(0)}`}
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
                        isLastItem(props.payload, filteredData.indexOf(props.payload), filteredData)

                      const formattedValue = `$${(value as number).toFixed(2)} (${props.payload?.percentIncrease.toFixed(2)}%)`

                      if (isLast && lastCycleProgress < 1) {
                        return `${formattedValue} (${Math.round(lastCycleProgress * 100)}% complete)`
                      }

                      return formattedValue
                    }}
                  />
                }
              />
              <Bar
                dataKey="valueIncrease"
                fill="hsl(var(--chart-1))"
                radius={[4, 4, 0, 0]}
                fillOpacity={(data, index) =>
                  index === filteredData.length - 1 && lastCycleProgress < 1 ? lastCycleAlpha : 0.8
                }
                stroke="hsl(var(--chart-1))"
                strokeWidth={1}
                strokeOpacity={(data, index) =>
                  index === filteredData.length - 1 && lastCycleProgress < 1 ? lastCycleAlpha : 1
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
            {!loading &&
              filteredData.length > 0 &&
              (isPositive ? (
                <>
                  Average gain of ${avgValueIncrease.toFixed(2)} per cycle{" "}
                  <TrendingUp className="h-4 w-4 text-primary" />
                </>
              ) : (
                <>
                  Average loss of ${Math.abs(avgValueIncrease).toFixed(2)} per cycle{" "}
                  <TrendingDown className="h-4 w-4 text-primary" />
                </>
              ))}
          </div>
          <div className="leading-none text-muted-foreground">
            {!loading && filteredData.length > 0 && (
              <>
                Best cycle: #{maxCycle} (${maxIncrease.toFixed(2)}) | Worst cycle: #{minCycle} ($
                {minIncrease.toFixed(2)})
              </>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

