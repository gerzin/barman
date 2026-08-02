"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

export function useAutoRefresh(enabled: boolean, intervalMs = 5000) {
    const router = useRouter()
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        if (!enabled) return

        const refresh = () => {
            router.refresh()
        }

        refresh()
        intervalRef.current = setInterval(refresh, intervalMs)

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                refresh()
            }
        }

        window.addEventListener("focus", refresh)
        document.addEventListener("visibilitychange", handleVisibilityChange)

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
            window.removeEventListener("focus", refresh)
            document.removeEventListener("visibilitychange", handleVisibilityChange)
        }
    }, [enabled, intervalMs, router])
}
