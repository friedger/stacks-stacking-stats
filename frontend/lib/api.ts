export async function fetchDashboardData() {
  try {
    const response = await fetch("/api/dashboard")

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    throw error
  }
}

/**
 * Fetches the current block height from the Stacks blockchain
 * @deprecated Use fetchDashboardData instead
 */
export async function fetchCurrentBlockHeight() {
  try {
    const response = await fetch("/api/block-height")

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching block height:", error)
    throw error
  }
}

/**
 * Fetches all cycle data
 * @deprecated Use fetchDashboardData instead
 */
export async function fetchCycleData() {
  try {
    const response = await fetch("/api/cycles")

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching cycle data:", error)
    throw error
  }
}

/**
 * Generates a new cycle
 */
export async function generateNewCycle(currentBlockHeight: number) {
  try {
    const response = await fetch("/api/cycles/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ currentBlockHeight }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error generating new cycle:", error)
    throw error
  }
}

