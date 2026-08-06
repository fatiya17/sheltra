"use client"

import { useState, useEffect, useCallback } from "react"
import { offlineReportService } from "../services/offline-report.service"
import { useToast } from "@/components/ui/toast"

export function useOfflineReports(onReportSynced) {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingReports, setPendingReports] = useState([])
  const [isSyncing, setIsSyncing] = useState(false)
  const toast = useToast()

  // load antrean draft awal
  const loadPendingReports = useCallback(async () => {
    const queue = await offlineReportService.getPendingReports()
    setPendingReports(queue)
  }, [])

  // auto sync draft pending
  const syncPendingReports = useCallback(async () => {
    const queue = await offlineReportService.getPendingReports()
    if (!queue || queue.length === 0 || !navigator.onLine) return

    setIsSyncing(true)
    let syncedCount = 0

    for (const report of queue) {
      try {
        // mock push ke server
        await new Promise((resolve) => setTimeout(resolve, 800))

        // hapus draft dari antrean
        await offlineReportService.removePendingReport(report.id)
        syncedCount++

        // update report ke feed
        if (onReportSynced) {
          onReportSynced({
            ...report,
            isOfflineDraft: false,
            status: "Laporan Baru (Tersinkronisasi)",
            createdAt: "Baru saja (dari draft offline)",
          })
        }
      } catch (err) {
        console.error("Gagal sinkronisasi laporan offline:", err)
        break // stop jika sync error
      }
    }

    setIsSyncing(false)
    await loadPendingReports()

    if (syncedCount > 0) {
      toast({
        title: "Laporan Terkirim",
        body: "Laporan yang tersimpan offline berhasil dikirim",
        type: "success",
      })
    }
  }, [onReportSynced, loadPendingReports, toast])

  useEffect(() => {
    // init status online & queue
    setIsOnline(navigator.onLine)
    loadPendingReports()

    const handleOnline = () => {
      setIsOnline(true)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [loadPendingReports, syncPendingReports])

  return {
    isOnline,
    pendingReports,
    pendingCount: pendingReports.length,
    isSyncing,
    refreshQueue: loadPendingReports,
    syncNow: syncPendingReports,
  }
}
