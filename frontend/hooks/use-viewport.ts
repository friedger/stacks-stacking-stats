"use client"

import { useState, useEffect } from "react"

// Define breakpoints
export const MOBILE_BREAKPOINT = 768 // md breakpoint in Tailwind

export function useViewport() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check if window is defined (client-side)
    if (typeof window !== "undefined") {
      // Initial check
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)

      // Handler to call on window resize
      const handleResize = () => {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
      }

      // Add event listener
      window.addEventListener("resize", handleResize)

      // Call handler right away so state gets updated with initial window size
      handleResize()

      // Remove event listener on cleanup
      return () => window.removeEventListener("resize", handleResize)
    }
  }, [])

  return { isMobile }
}

