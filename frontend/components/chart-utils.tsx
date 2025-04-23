"use client"

import { useState, useEffect } from "react"
import { fetchDashboardData } from "@/lib/api"

// Common utility for handling last cycle alpha values
export const BLOCKS_PER_CYCLE = 2100 // Standard blocks per cycle

// State for cycle data and block height
export function useCycleData() {
  const [data, setData] = useState<any[]>([])
  const [currentBlockHeight, setCurrentBlockHeight] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const response = await fetchDashboardData()

        if (!response.success) {
          throw new Error(response.message || "Failed to fetch dashboard data")
        }

        setData(response.cycles)
        setCurrentBlockHeight(response.blockHeight)
        setLastUpdated(response.timestamp)
        setError(null)
      } catch (err) {
        console.error("Error fetching cycle data:", err)
        setError(err instanceof Error ? err.message : "Unknown error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Refresh data every 5 minutes
    const intervalId = setInterval(fetchData, 5 * 60 * 1000)

    return () => clearInterval(intervalId)
  }, [])

  return { data, currentBlockHeight, loading, error, lastUpdated }
}

// Calculate the progress of the last cycle based on current block height
export function calculateCycleProgress(lastCycle: any, currentBlockHeight: number | null) {
  if (!lastCycle || !currentBlockHeight) return 0

  const blocksCompleted = Math.max(0, Math.min(currentBlockHeight - lastCycle.cycleStart, BLOCKS_PER_CYCLE))
  return blocksCompleted / BLOCKS_PER_CYCLE
}

// Helper to determine if an item is the last in an array
export function isLastItem(item: any, index: number, array: any[]) {
  return index === array.length - 1
}

// Format the cycle progress for display
export function formatCycleProgress(lastCycle: any, currentBlockHeight: number | null) {
  if (!lastCycle || !currentBlockHeight) return "unknown"

  const blocksCompleted = Math.max(0, Math.min(currentBlockHeight - lastCycle.cycleStart, BLOCKS_PER_CYCLE))
  const progress = (blocksCompleted / BLOCKS_PER_CYCLE) * 100

  return `${Math.round(progress)}% complete (${blocksCompleted} of ${BLOCKS_PER_CYCLE} blocks)`
}

// Filter data based on viewport
export function getFilteredData(data: any[], isMobile: boolean) {
  if (!data || data.length === 0) return []

  if (isMobile) {
    // For mobile, show only the last 3 cycles
    return data.slice(-3)
  } else {
    // For desktop, show the last 20 cycles
    return data.slice(-20)
  }
}

// Get cycles data for line chart
export function getCyclesData(data: any[], isMobile = false) {
  const filteredData = getFilteredData(data, isMobile)

  return filteredData.map((cycle) => ({
    cycle: cycle.cycle,
    cycleLabel: `${cycle.cycle}`, // String representation for x-axis
    stxPriceAtEnd: cycle.stxPriceAtEnd,
    stackedUsd: cycle.stackedUsd,
    rewardsUsd: cycle.rewardsUsd,
    blockRewardsUsd: cycle.blockRewardsUsd,
    cycleYield: cycle.cycleYield,
    threshold: cycle.threshold,
    btcPriceAtEnd: cycle.btcPriceAtEnd,
    apy: cycle.apy,
  }))
}

// Get the value increase data
export function getValueIncreaseData(data: any[], isMobile = false) {
  const filteredData = getFilteredData(data, isMobile)

  if (filteredData.length === 0) return []

  return filteredData.map((cycle, index, array) => {
    // For the first cycle in our filtered view, we need to handle it specially
    if (index === 0) {
      // If this is the first cycle in the entire dataset, return 0
      if (cycle.cycle === data[0].cycle) {
        return {
          cycle: `${cycle.cycle}`,
          valueIncrease: 0,
          percentIncrease: 0,
        }
      }

      // Otherwise, find the previous cycle from the full dataset
      const fullDataIndex = data.findIndex((c) => c.cycle === cycle.cycle)
      if (fullDataIndex <= 0) {
        return {
          cycle: `${cycle.cycle}`,
          valueIncrease: 0,
          percentIncrease: 0,
        }
      }

      const previousCycle = data[fullDataIndex - 1]

      // Calculate using the previous cycle from the full dataset
      const initialStxAmount = 1000 / previousCycle.stxPriceAtEnd
      const endStxAmount = initialStxAmount * (1 + cycle.cycleYield)
      const endUsdValue = endStxAmount * cycle.stxPriceAtEnd
      const valueIncrease = endUsdValue - 1000
      const percentIncrease = (valueIncrease / 1000) * 100

      return {
        cycle: `${cycle.cycle}`,
        valueIncrease: Number(valueIncrease.toFixed(2)),
        percentIncrease: Number(percentIncrease.toFixed(2)),
      }
    }

    // For subsequent cycles in our filtered view, calculate normally
    const previousCycle = array[index - 1]

    // 1. Initial STX amount = $1000 / previous cycle's STX price
    const initialStxAmount = 1000 / previousCycle.stxPriceAtEnd

    // 2. End STX amount = Initial STX amount * (1 + cycleYield)
    const endStxAmount = initialStxAmount * (1 + cycle.cycleYield)

    // 3. End USD value = End STX amount * current cycle's STX price
    const endUsdValue = endStxAmount * cycle.stxPriceAtEnd

    // 4. Value increase = End USD value - $1000
    const valueIncrease = endUsdValue - 1000

    // 5. Percentage increase = (Value increase / $1000) * 100
    const percentIncrease = (valueIncrease / 1000) * 100

    return {
      cycle: `${cycle.cycle}`,
      valueIncrease: Number(valueIncrease.toFixed(2)),
      percentIncrease: Number(percentIncrease.toFixed(2)),
    }
  })
}

// Get threshold data for bar chart
export function getThresholdData(data: any[], isMobile = false) {
  const filteredData = getFilteredData(data, isMobile)

  if (filteredData.length === 0) return []

  // For threshold data, we need to include cycles where threshold changes
  return filteredData
    .filter((cycle, index, array) => {
      // Always include the first cycle in our filtered view
      if (index === 0) return true

      // Include cycles where threshold changes
      return cycle.threshold !== array[index - 1].threshold || index === array.length - 1
    })
    .map((cycle) => ({
      cycle: `#${cycle.cycle}`,
      threshold: cycle.threshold / 1000000, // Convert from μSTX to STX
    }))
}

// Get data for area chart
export function getAreaChartData(data: any[], isMobile = false) {
  const filteredData = getFilteredData(data, isMobile)

  if (filteredData.length === 0) return []

  return filteredData.map((cycle) => ({
    cycle: `${cycle.cycle}`,
    rewardsUsd: cycle.rewardsUsd,
    blockRewardsUsd: cycle.blockRewardsUsd,
    difference: cycle.rewardsUsd - cycle.blockRewardsUsd,
  }))
}

// Format date from ISO string to readable format
export function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// Get all cycles data for the table view
export function getAllCyclesData(data: any[]) {
  if (!data || data.length === 0) return []

  return data.map((cycle) => ({
    ...cycle,
    cycleStartDateFormatted: formatDate(cycle.cycleStartDate),
    cycleRewardsEndDateFormatted: formatDate(cycle.cycleRewardsEndDate),
    stackedUsdFormatted: `$${(cycle.stackedUsd / 1000000).toFixed(2)}M`,
    rewardsUsdFormatted: `$${(cycle.rewardsUsd / 1000).toFixed(2)}K`,
    blockRewardsUsdFormatted: `$${(cycle.blockRewardsUsd / 1000).toFixed(2)}K`,
    cycleYieldFormatted: `${(cycle.cycleYield * 100).toFixed(4)}%`,
    apyFormatted: `${(cycle.apy * 100).toFixed(2)}%`,
    thresholdFormatted: `${(cycle.threshold / 1000000).toLocaleString()} STX`,
  }))
}

