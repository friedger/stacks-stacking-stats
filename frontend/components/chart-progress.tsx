"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Zap, RefreshCw, Flame, AlertCircle } from "lucide-react"
import { useEffect, useState } from "react"
import allData from "@/data/all.json"
import { BLOCKS_PER_CYCLE } from "./chart-utils"
import { Button } from "@/components/ui/button"
import { fetchDashboardData } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"

// Constants for the cycle structure
const PROOF_OF_BURN_START = 2000 // Block at which proof of burn starts
const PROOF_OF_BURN_BLOCKS = 100 // Number of blocks in proof of burn period

export function ChartProgress() {
  // State for cycle data and block height
  const [cycleData, setCycleData] = useState(allData)
  const [currentBlockHeight, setCurrentBlockHeight] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  // Get the last cycle data
  const lastCycle = cycleData[cycleData.length - 1]

  // Calculate progress based on current block height
  const blocksCompleted = currentBlockHeight ? Math.min(currentBlockHeight - lastCycle.cycleStart, BLOCKS_PER_CYCLE) : 0
  const isCycleCompleted = blocksCompleted >= BLOCKS_PER_CYCLE

  const progress = Math.floor((blocksCompleted / BLOCKS_PER_CYCLE) * 100)

  // Calculate if we're in the proof of burn period
  const isInProofOfBurn = blocksCompleted >= PROOF_OF_BURN_START
  const proofOfBurnProgress = isInProofOfBurn
    ? Math.min(blocksCompleted - PROOF_OF_BURN_START, PROOF_OF_BURN_BLOCKS)
    : 0
  const proofOfBurnPercentage = (proofOfBurnProgress / PROOF_OF_BURN_BLOCKS) * 100

  // Calculate regular progress (before proof of burn)
  const regularProgress = Math.min(blocksCompleted, PROOF_OF_BURN_START)
  const regularProgressPercentage = (regularProgress / PROOF_OF_BURN_START) * 95 // 95% of the bar for regular progress

  // Calculate estimated time remaining (assuming average block time of 10 minutes)
  const blocksRemaining = BLOCKS_PER_CYCLE - blocksCompleted
  const minutesRemaining = blocksRemaining * 10
  const daysRemaining = Math.floor(minutesRemaining / (24 * 60))
  const hoursRemaining = Math.floor((minutesRemaining % (24 * 60)) / 60)
  const minsRemaining = Math.floor(minutesRemaining % 60)

  // Format the time string
  const timeRemainingStr =
    daysRemaining > 0
      ? `${daysRemaining}d ${hoursRemaining}h ${minsRemaining}m`
      : hoursRemaining > 0
        ? `${hoursRemaining}h ${minsRemaining}m`
        : `${minsRemaining}m`

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await fetchDashboardData()

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch dashboard data")
      }

      // Update both cycle data and block height from the single response
      setCycleData(data.cycles)
      setCurrentBlockHeight(data.blockHeight)
      setLastUpdated(data.timestamp)

      // Show toast notification if new cycles were generated
      if (data.newCyclesGenerated > 0) {
        toast({
          title: `${data.newCyclesGenerated} New Cycle${data.newCyclesGenerated > 1 ? "s" : ""} Generated`,
          description: `The system automatically generated ${data.newCyclesGenerated} new cycle${data.newCyclesGenerated > 1 ? "s" : ""} based on the current block height.`,
        })
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err)
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Set up polling every 5 minutes
    const intervalId = setInterval(fetchData, 5 * 60 * 1000)

    return () => clearInterval(intervalId)
  }, [])

  return (
    <Card className="card border-0 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <span className="text-primary">⚡</span> Current Cycle Progress
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span className="sr-only">Refresh</span>
            </Button>
          </div>
        </div>
        <CardDescription>
          Cycle #{lastCycle.cycle} Block Progress
          {lastUpdated && (
            <span className="text-xs ml-2 text-muted-foreground">
              (Updated: {new Date(lastUpdated).toLocaleTimeString()})
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        {error ? (
          <div className="p-4 bg-destructive/10 text-destructive rounded-md">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <div>
                <div className="font-medium">Error</div>
                <div className="text-sm">{error}. Using simulated data instead.</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="font-medium">Blocks Completed</div>
              <div className="text-primary font-bold">
                {loading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  `${blocksCompleted} / ${BLOCKS_PER_CYCLE}`
                )}
              </div>
            </div>

            {/* Custom progress bar with marker and proof of burn section */}
            <div className="relative h-4 w-full overflow-hidden rounded-full bg-muted">
              {/* Regular progress */}
              <div
                className={`absolute left-0 top-0 h-full bg-primary transition-all ${loading ? "animate-pulse" : ""}`}
                style={{ width: `${loading ? 30 : regularProgressPercentage}%` }}
              />

              {/* Marker at 2000 blocks */}
              <div className="absolute top-0 h-full w-0.5 bg-white z-10" style={{ left: "95%" }} />

              {/* Proof of burn progress */}
              {isInProofOfBurn && (
                <div
                  className="absolute top-0 h-full bg-accent transition-all"
                  style={{
                    left: "95%",
                    width: `${(proofOfBurnPercentage / 100) * 5}%`, // 5% of the bar for proof of burn
                  }}
                />
              )}
            </div>

            {/* Legend for the progress bar */}
            <div className="flex justify-between text-xs text-muted-foreground">
              <div>0</div>
              <div className="flex items-center gap-1">
                <span>Proof-of-Transfer</span>
                <div className="h-2 w-2 bg-primary rounded-full"></div>
              </div>
              <div className="flex items-center gap-1">
                <span>Proof-of-Burn</span>
                <div className="h-2 w-2 bg-accent rounded-full"></div>
                <Flame className="h-3 w-3 text-accent" />
                <span>2100</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="text-sm text-muted-foreground">Start Block</div>
                <div className="font-bold">{lastCycle.cycleStart}</div>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="text-sm text-muted-foreground">Current</div>
                <div className="font-bold">
                  {loading ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : currentBlockHeight ? (
                    currentBlockHeight
                  ) : (
                    "Unknown"
                  )}
                </div>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="text-sm text-muted-foreground">End Block</div>
                <div className="font-bold">{lastCycle.cycleRewardsEnd}</div>
              </div>
            </div>

            {/* Cycle completion message */}
            {isCycleCompleted && (
              <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <Zap className="h-5 w-5 text-primary flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm">Cycle Completed!</div>
                  <div className="text-xs text-muted-foreground">
                    This cycle has been completed. The system will automatically generate a new cycle on the next
                    refresh.
                  </div>
                </div>
              </div>
            )}

            {/* Proof of burn explanation */}
            {isInProofOfBurn && !isCycleCompleted && (
              <div className="flex items-center gap-2 p-3 bg-accent/10 rounded-lg border border-accent/20">
                <Flame className="h-5 w-5 text-accent flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm">Proof of Burn Period</div>
                  <div className="text-xs text-muted-foreground">
                    Last 100 blocks of the cycle where bitcoins are burned to validate the cycle.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-4">
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2 w-full">
            {!isCycleCompleted && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium leading-none">
                  <Clock className="h-4 w-4 text-primary" /> Est. Time Remaining
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold">
                    {loading ? <span className="animate-pulse">--</span> : timeRemainingStr}
                  </span>
                  <Zap className="h-4 w-4 text-primary" />
                </div>
              </div>
            )}
            <div className="leading-none text-muted-foreground">
              {loading ? (
                <span className="animate-pulse">Loading progress data...</span>
              ) : isCycleCompleted ? (
                `Cycle #${lastCycle.cycle} completed! A new cycle will be generated automatically.`
              ) : (
                `${progress}% complete (${blocksCompleted} of ${BLOCKS_PER_CYCLE} blocks)`
              )}
              {isInProofOfBurn && !isCycleCompleted && (
                <span className="ml-1 text-accent">• {proofOfBurnProgress} blocks in proof of burn</span>
              )}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

