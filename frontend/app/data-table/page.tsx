"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, ChevronDown, ChevronUp, Search, Download } from "lucide-react"
import { getAllCyclesData, useCycleData } from "@/components/chart-utils"
import { ThemeToggleDegen } from "@/components/theme-toggle-degen"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function DataTablePage() {
  const { data, loading, error } = useCycleData()
  const allCyclesData = getAllCyclesData(data)

  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<string>("cycle")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Filter data based on search term
  const filteredData = allCyclesData.filter((cycle) => {
    const cycleStr = cycle.cycle.toString()
    return cycleStr.includes(searchTerm)
  })

  // Sort data based on sort field and direction
  const sortedData = [...filteredData].sort((a, b) => {
    let aValue = a[sortField as keyof typeof a]
    let bValue = b[sortField as keyof typeof b]

    // Handle string vs number comparison
    if (typeof aValue === "string" && typeof bValue === "string") {
      if (!isNaN(Number(aValue)) && !isNaN(Number(bValue))) {
        aValue = Number(aValue)
        bValue = Number(bValue)
      }
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
    return 0
  })

  // Handle sort click
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Handle CSV export
  const exportToCsv = () => {
    // Define the headers
    const headers = [
      "Cycle",
      "Start Block",
      "End Block",
      "Start Date",
      "End Date",
      "STX Price",
      "BTC Price",
      "BTC Rewards",
      "Total Stacked",
      "Rewards USD",
      "Block Rewards USD",
      "Stacked USD",
      "Cycle Yield",
      "APY",
      "Threshold",
    ]

    // Map the data to CSV rows
    const csvRows = [
      headers.join(","),
      ...sortedData.map((cycle) =>
        [
          cycle.cycle,
          cycle.cycleStart,
          cycle.cycleRewardsEnd,
          cycle.cycleStartDate,
          cycle.cycleRewardsEndDate,
          cycle.stxPriceAtEnd,
          cycle.btcPriceAtEnd,
          cycle.btcRewards,
          cycle.totalStacked,
          cycle.rewardsUsd,
          cycle.blockRewardsUsd,
          cycle.stackedUsd,
          cycle.cycleYield,
          cycle.apy,
          cycle.threshold,
        ].join(","),
      ),
    ]

    // Create a blob and download
    const csvContent = csvRows.join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "stacking_cycles_data.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Render sort icon
  const renderSortIcon = (field: string) => {
    if (sortField !== field) return null
    return sortDirection === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
  }

  return (
    <div className="min-h-svh flex flex-col p-6">
      <header className="w-full max-w-7xl mx-auto flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg flex items-center justify-center w-12 h-12">
            <Image src="/logo.png" alt="StackStats Logo" width={32} height={32} className="invert" />
          </div>
          <h1 className="text-4xl font-extrabold neon-text">
            STACK<span className="text-primary">STATS</span>
          </h1>
        </div>
        <ThemeToggleDegen />
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <Link href="/" className="flex items-center text-primary hover:underline">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by cycle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button variant="outline" onClick={exportToCsv} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-muted-foreground">Loading cycle data...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-[300px] text-destructive">
                <p>Error loading data: {error}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("cycle")}>
                      <div className="flex items-center">Cycle {renderSortIcon("cycle")}</div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("cycleStartDateFormatted")}
                    >
                      <div className="flex items-center">Start Date {renderSortIcon("cycleStartDateFormatted")}</div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("cycleRewardsEndDateFormatted")}
                    >
                      <div className="flex items-center">End Date {renderSortIcon("cycleRewardsEndDateFormatted")}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("stxPriceAtEnd")}>
                      <div className="flex items-center">STX Price {renderSortIcon("stxPriceAtEnd")}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("btcPriceAtEnd")}>
                      <div className="flex items-center">BTC Price {renderSortIcon("btcPriceAtEnd")}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("stackedUsd")}>
                      <div className="flex items-center">Stacked USD {renderSortIcon("stackedUsd")}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("rewardsUsd")}>
                      <div className="flex items-center">Rewards USD {renderSortIcon("rewardsUsd")}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("cycleYield")}>
                      <div className="flex items-center">Yield {renderSortIcon("cycleYield")}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("apy")}>
                      <div className="flex items-center">APY {renderSortIcon("apy")}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("threshold")}>
                      <div className="flex items-center">Threshold {renderSortIcon("threshold")}</div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8">
                        No cycles found matching your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedData.map((cycle) => (
                      <TableRow key={cycle.cycle}>
                        <TableCell className="font-medium">#{cycle.cycle}</TableCell>
                        <TableCell>{cycle.cycleStartDateFormatted}</TableCell>
                        <TableCell>{cycle.cycleRewardsEndDateFormatted}</TableCell>
                        <TableCell>${cycle.stxPriceAtEnd.toFixed(4)}</TableCell>
                        <TableCell>
                          ${cycle.btcPriceAtEnd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>{cycle.stackedUsdFormatted}</TableCell>
                        <TableCell>{cycle.rewardsUsdFormatted}</TableCell>
                        <TableCell>{cycle.cycleYieldFormatted}</TableCell>
                        <TableCell>{cycle.apyFormatted}</TableCell>
                        <TableCell>{(cycle.threshold / 1000000).toLocaleString()} STX</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>Built for degens, by degens. WAGMI 🚀</p>
      </footer>
    </div>
  )
}

