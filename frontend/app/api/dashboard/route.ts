import { NextResponse } from "next/server"
import { readCycleData, writeCycleData } from "@/lib/cycle-storage"

// Stacks API endpoint for getting info about the blockchain
const STACKS_API_URL = "https://api.mainnet.hiro.so/v2/info"

// Function to generate a new cycle based on the previous one
function generateNextCycle(lastCycle: any) {
  // Get the next cycle number
  const nextCycleNumber = lastCycle.cycle + 1

  // Calculate new cycle start and end blocks
  const cycleStart = lastCycle.cycleRewardsEnd + 100
  const cycleRewardsEnd = cycleStart + 2000

  // Generate random values for the new cycle
  const stxPriceAtEnd = Number.parseFloat((lastCycle.stxPriceAtEnd * (0.8 + Math.random() * 0.4)).toFixed(10))
  const btcPriceAtEnd = Number.parseFloat((lastCycle.btcPriceAtEnd * (0.9 + Math.random() * 0.3)).toFixed(10))

  // Calculate random rewards
  const btcRewards = Number.parseFloat((lastCycle.btcRewards * (0.8 + Math.random() * 0.5)).toFixed(6))
  const fastPoolV1 = Number.parseFloat((lastCycle.fastPoolV1 * (0.8 + Math.random() * 0.5)).toFixed(6))
  const fastPoolV2 = Number.parseFloat((lastCycle.fastPoolV2 * (0.8 + Math.random() * 0.5) + 0.01).toFixed(6))

  // Calculate stacked amount with some growth
  const totalStacked = (Number.parseInt(lastCycle.totalStacked) * (0.95 + Math.random() * 0.15)).toString()

  // Calculate USD values
  const rewardsUsd = Number.parseFloat((btcRewards * btcPriceAtEnd).toFixed(10))
  const blockRewardsUsd = Number.parseFloat((rewardsUsd * (0.9 + Math.random() * 0.4)).toFixed(10))
  const stackedUsd = Number.parseFloat(((Number.parseInt(totalStacked) * stxPriceAtEnd) / 1000000).toFixed(10))

  // Calculate yield metrics
  const cycleYield = Number.parseFloat((rewardsUsd / stackedUsd).toFixed(10))
  const apy = Number.parseFloat((cycleYield * 26).toFixed(10)) // Approximate annual yield

  // Determine if threshold should change (10% chance)
  const threshold = Math.random() < 0.1 ? lastCycle.threshold + 10000000000 : lastCycle.threshold

  // Calculate dates
  const cycleStartDate = new Date(new Date(lastCycle.cycleRewardsEndDate).getTime() + 24 * 60 * 60 * 1000).toISOString()
  const cycleRewardsEndDate = new Date(new Date(cycleStartDate).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()

  // Generate random Stacks cycle values
  const stacksCycleStart = lastCycle.stacksCycleRewardsEnd + Math.floor(Math.random() * 10000)
  const stacksCycleRewardsEnd = stacksCycleStart + Math.floor(Math.random() * 50000) + 10000

  return {
    cycle: nextCycleNumber,
    cycleStart,
    cycleRewardsEnd,
    stacksCycleStart,
    stacksCycleRewardsEnd,
    cycleStartDate,
    cycleRewardsEndDate,
    stxPriceAtEnd,
    btcPriceAtEnd,
    btcRewards,
    fastPoolV1,
    fastPoolV2,
    totalStacked,
    rewardsUsd,
    blockRewardsUsd,
    stackedUsd,
    cycleYield,
    apy,
    threshold,
  }
}

export async function GET() {
  try {
    // Fetch blockchain info from Stacks API
    const response = await fetch(STACKS_API_URL)

    if (!response.ok) {
      throw new Error(`Failed to fetch block height: ${response.status}`)
    }

    const blockchainData = await response.json()
    const currentBlockHeight = blockchainData.burn_block_height

    // Fetch cycle data
    let cycleData = await readCycleData()

    if (cycleData.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No existing cycle data found",
        },
        { status: 400 },
      )
    }

    // Check if we need to generate new cycles
    let lastCycle = cycleData[cycleData.length - 1]
    let newCyclesGenerated = 0
    const newCycles = []

    // Keep generating new cycles as long as the current block height is past the end of the last cycle
    // We add 100 blocks as a buffer between cycles
    while (currentBlockHeight >= lastCycle.cycleRewardsEnd + 100) {
      // Generate a new cycle
      const newCycle = generateNextCycle(lastCycle)
      newCycles.push(newCycle)

      // Add the new cycle to the data
      cycleData = [...cycleData, newCycle]

      // Update the last cycle reference
      lastCycle = newCycle
      newCyclesGenerated++

      // Safety check to prevent infinite loops (just in case)
      if (newCyclesGenerated > 10) {
        console.warn("Generated 10 cycles, breaking to prevent potential infinite loop")
        break
      }
    }

    // If we generated new cycles, save them to storage
    if (newCyclesGenerated > 0) {
      const success = await writeCycleData(cycleData)
      if (!success) {
        console.error("Failed to write updated cycle data")
      }
    }

    // Return combined data
    return NextResponse.json({
      success: true,
      blockHeight: currentBlockHeight,
      timestamp: new Date().toISOString(),
      cycles: cycleData,
      newCyclesGenerated,
      newCycles,
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch dashboard data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

