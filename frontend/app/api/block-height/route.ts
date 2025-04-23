import { NextResponse } from "next/server"

// Stacks API endpoint for getting info about the blockchain
const STACKS_API_URL = "https://api.mainnet.hiro.so/v2/info"

export async function GET() {
  try {
    // Fetch blockchain info from Stacks API
    const response = await fetch(STACKS_API_URL)

    if (!response.ok) {
      throw new Error(`Failed to fetch block height: ${response.status}`)
    }

    const data = await response.json()

    const blockHeight = data.burn_block_height

    // Return the current block height and other relevant info
    return NextResponse.json({
      success: true,
      blockHeight,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching block height:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch current block height",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

