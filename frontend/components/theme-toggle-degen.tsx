"use client"

import { useEffect, useState } from "react"
import { Moon, Sun, Zap } from "lucide-react"

export function ThemeToggleDegen() {
  const [theme, setTheme] = useState("dark")

  useEffect(() => {
    // Check for system preference on initial load
    const systemPreference = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    const savedTheme = localStorage.getItem("theme") || systemPreference
    setTheme(savedTheme)

    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark")
      document.documentElement.classList.remove("light")
    } else {
      document.documentElement.classList.add("light")
      document.documentElement.classList.remove("dark")
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)

    if (newTheme === "dark") {
      document.documentElement.classList.add("dark")
      document.documentElement.classList.remove("light")
    } else {
      document.documentElement.classList.add("light")
      document.documentElement.classList.remove("dark")
    }
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative p-3 rounded-xl bg-muted hover:bg-muted/80 text-primary transition-all duration-300 ease-out group overflow-hidden"
      aria-label="Toggle theme"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative z-10 flex items-center gap-2">
        {theme === "light" ? (
          <>
            <Moon size={18} className="text-primary" />
            <span className="text-sm font-bold">DEGEN MODE</span>
            <Zap size={14} className="text-primary animate-pulse" />
          </>
        ) : (
          <>
            <Sun size={18} className="text-primary" />
            <span className="text-sm font-bold">NORMIE MODE</span>
          </>
        )}
      </div>
    </button>
  )
}

