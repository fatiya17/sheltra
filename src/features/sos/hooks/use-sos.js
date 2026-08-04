"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { sosService } from "../services/sos.service"
import { SOS_HOLD_DURATION_MS } from "../constants/sos.constants"

export function useSos() {
  // state status sos utama
  const [status, setStatus] = useState("idle") // 'idle' | 'holding' | 'active' | 'cancelled'
  const [holdProgress, setHoldProgress] = useState(0)
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [activeDurationSeconds, setActiveDurationSeconds] = useState(0)

  // state data lokasi & kontak
  const [trustedContacts, setTrustedContacts] = useState([])
  const [userLocation, setUserLocation] = useState({
    coords: [106.8105, -6.2307],
    hasGps: true,
    error: null,
    accuracy: null,
  })
  const [dispatchResults, setDispatchResults] = useState([])
  const [safePoints, setSafePoints] = useState([])
  const [isOnline, setIsOnline] = useState(true)
  const [offlineQueueCount, setOfflineQueueCount] = useState(0)

  // refs untuk timer dan animasi
  const holdStartTimeRef = useRef(null)
  const holdAnimFrameRef = useRef(null)
  const activeTimerRef = useRef(null)

  // load kontak saat pertama kali
  useEffect(() => {
    const contacts = sosService.getTrustedContacts()
    setTrustedContacts(contacts)
    setSafePoints(sosService.getNearbySafePoints(userLocation.coords))

    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine)

      const handleOnline = () => {
        setIsOnline(true)
        const flushed = sosService.getAndClearOfflineQueue()
        if (flushed.length > 0) {
          setOfflineQueueCount(0)
        }
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
    }
  }, [])

  // request dan pantau lokasi gps realtime sejak halaman dimuat
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return

    // request izin & ambil posisi awal
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.longitude, pos.coords.latitude]
        setUserLocation({
          coords,
          hasGps: true,
          error: null,
          accuracy: pos.coords.accuracy,
        })
        setSafePoints(sosService.getNearbySafePoints(coords))
      },
      () => {
        // izin ditolak atau tidak tersedia, tetap gunakan fallback
        setUserLocation((prev) => ({ ...prev, hasGps: false, error: "PERMISSION_DENIED" }))
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    )

    // pantau perubahan lokasi secara berkelanjutan
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = [pos.coords.longitude, pos.coords.latitude]
        setUserLocation({
          coords,
          hasGps: true,
          error: null,
          accuracy: pos.coords.accuracy,
        })
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 15000 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  // timer durasi sos aktif
  useEffect(() => {
    if (status === "active") {
      setActiveDurationSeconds(0)
      activeTimerRef.current = setInterval(() => {
        setActiveDurationSeconds((prev) => prev + 1)
      }, 1000)
    } else {
      if (activeTimerRef.current) {
        clearInterval(activeTimerRef.current)
        activeTimerRef.current = null
      }
    }
    return () => {
      if (activeTimerRef.current) clearInterval(activeTimerRef.current)
    }
  }, [status])

  // pemicu aktifkan sos
  const triggerSos = useCallback(async () => {
    setStatus("active")
    setHoldProgress(100)

    // getar haptic darurat
    if (typeof window !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate([200, 100, 200, 100, 500])
      } catch (e) {
        // ignore
      }
    }

    // nyalakan alarm lokal
    sosService.startAlarm()
    setIsAlarmPlaying(true)
    setIsMuted(false)

    // ambil lokasi gps
    const locResult = await sosService.getCurrentLocation()
    const coords = locResult.coords || [106.8105, -6.2307]

    setUserLocation({
      coords,
      hasGps: locResult.success,
      error: locResult.error || null,
      accuracy: locResult.accuracy || null,
    })

    // perbarui list safe points
    const nearby = sosService.getNearbySafePoints(coords)
    setSafePoints(nearby)

    // broadcast notifikasi ke kontak
    const currentOnline = typeof navigator !== "undefined" ? navigator.onLine : true
    const results = await sosService.dispatchSosToContacts(
      trustedContacts,
      coords,
      locResult.success,
      currentOnline
    )

    setDispatchResults(results)
  }, [trustedContacts])

  // handler mulai hold 2 detik
  const startHolding = useCallback(() => {
    if (status === "active") return

    setStatus("holding")
    holdStartTimeRef.current = Date.now()

    // getar haptic awal
    if (typeof window !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(50)
      } catch (e) {
        // ignore
      }
    }

    const updateHoldProgress = () => {
      if (!holdStartTimeRef.current) return
      const elapsed = Date.now() - holdStartTimeRef.current
      const progress = Math.min(100, (elapsed / SOS_HOLD_DURATION_MS) * 100)

      setHoldProgress(progress)

      if (progress >= 100) {
        holdStartTimeRef.current = null
        triggerSos()
      } else {
        holdAnimFrameRef.current = requestAnimationFrame(updateHoldProgress)
      }
    }

    holdAnimFrameRef.current = requestAnimationFrame(updateHoldProgress)
  }, [status, triggerSos])

  // handler batal hold sebelum 2 detik
  const stopHolding = useCallback(() => {
    if (status === "holding") {
      if (holdAnimFrameRef.current) {
        cancelAnimationFrame(holdAnimFrameRef.current)
        holdAnimFrameRef.current = null
      }
      holdStartTimeRef.current = null
      setHoldProgress(0)
      setStatus("idle")
    }
  }, [status])

  // matikan / batalkan sos aktif
  const cancelSos = useCallback(() => {
    sosService.stopAlarm()
    setIsAlarmPlaying(false)
    setStatus("idle")
    setHoldProgress(0)
    setActiveDurationSeconds(0)
  }, [])

  // toggle bisukan alarm
  const toggleMute = useCallback(() => {
    const nextMuted = sosService.toggleMute()
    setIsMuted(nextMuted)
  }, [])

  // tambah kontak baru
  const addContact = useCallback(
    (newContact) => {
      const updated = [
        ...trustedContacts,
        {
          id: `tc-${Date.now()}`,
          ...newContact,
        },
      ]
      setTrustedContacts(updated)
      sosService.saveTrustedContacts(updated)
    },
    [trustedContacts]
  )

  // edit kontak
  const updateContact = useCallback(
    (id, updatedData) => {
      const updated = trustedContacts.map((c) => (c.id === id ? { ...c, ...updatedData } : c))
      setTrustedContacts(updated)
      sosService.saveTrustedContacts(updated)
    },
    [trustedContacts]
  )

  // hapus kontak
  const deleteContact = useCallback(
    (id) => {
      const updated = trustedContacts.filter((c) => c.id !== id)
      setTrustedContacts(updated)
      sosService.saveTrustedContacts(updated)
    },
    [trustedContacts]
  )

  // cleanup saat unmount
  useEffect(() => {
    return () => {
      sosService.stopAlarm()
      if (holdAnimFrameRef.current) cancelAnimationFrame(holdAnimFrameRef.current)
      if (activeTimerRef.current) clearInterval(activeTimerRef.current)
    }
  }, [])

  return {
    status,
    holdProgress,
    isAlarmPlaying,
    isMuted,
    activeDurationSeconds,
    trustedContacts,
    userLocation,
    dispatchResults,
    safePoints,
    isOnline,
    offlineQueueCount,
    startHolding,
    stopHolding,
    triggerSos,
    cancelSos,
    toggleMute,
    addContact,
    updateContact,
    deleteContact,
  }
}
