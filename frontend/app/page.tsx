import Image from "next/image"
import Link from "next/link"
import { ChartArea } from "@/components/chart-area"
import { ChartBar } from "@/components/chart-bar"
import { ChartLine } from "@/components/chart-line"
import { ChartValueIncrease } from "@/components/chart-value-increase"
import { ChartProgress } from "@/components/chart-progress"
import { ThemeToggleDegen } from "@/components/theme-toggle-degen"
import { TrendingUp, Zap, Table2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Page() {
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
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Stacking Metrics</h2>
            <div className="ml-2 flex items-center gap-2 bg-muted px-3 py-1 rounded-full text-sm">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span>Bullish AF</span>
            </div>
          </div>
          <Link href="/data-table">
            <Button variant="outline" className="flex items-center gap-2">
              <Table2 className="h-4 w-4" />
              View Full Data Table
            </Button>
          </Link>
        </div>

        {/* Add the progress chart at the top */}
        <div className="mb-6 gradient-border">
          <ChartProgress />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="gradient-border">
            <ChartLine />
          </div>
          <div className="gradient-border">
            <ChartBar />
          </div>
          <div className="gradient-border">
            <ChartArea />
          </div>
          <div className="gradient-border">
            <ChartValueIncrease />
          </div>
        </div>
      </main>

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>Built for degens, by degens. WAGMI 🚀</p>
      </footer>
    </div>
  )
}

