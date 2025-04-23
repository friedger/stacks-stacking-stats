import fs from "fs"
import path from "path"
import allData from "@/data/all.json"

// Path to our data file
const DATA_FILE_PATH = path.join(process.cwd(), "data", "all.json")

// Function to read cycle data
export async function readCycleData() {
  try {
    // In production, you might want to read directly from the file
    // For simplicity in this demo, we'll use the imported data
    return allData
  } catch (error) {
    console.error("Error reading cycle data:", error)
    return []
  }
}

// Function to write cycle data
export async function writeCycleData(data: any[]) {
  try {
    // Ensure the directory exists
    const dir = path.dirname(DATA_FILE_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    // Write the data to the file
    await fs.promises.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2))
    return true
  } catch (error) {
    console.error("Error writing cycle data:", error)
    return false
  }
}

