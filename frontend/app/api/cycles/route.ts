import { NextResponse } from "next/server"
import { readCycleData } from "@/lib/cycle-storage"

export async function GET() {
  try {
    const cycleData = await readCycleData()

    return NextResponse.json({
      success: true,
      data: cycleData,
    })
  } catch (error) {
    console.error("Error fetching cycle data:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch cycle data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

