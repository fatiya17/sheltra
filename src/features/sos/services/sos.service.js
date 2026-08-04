import {
  DEFAULT_TRUSTED_CONTACTS,
  SOS_STORAGE_KEYS,
  MOCK_NEARBY_SAFE_POINTS,
} from "../constants/sos.constants"

class SosService {
  constructor() {
    this.audioContext = null
    this.oscillator1 = null
    this.oscillator2 = null
    this.gainNode = null
    this.sirenInterval = null
    this.isAudioPlaying = false
    this.isMuted = false
  }

  // inisialisasi audio synth
  initAudio() {
    if (typeof window === "undefined") return
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (AudioCtx) {
        this.audioContext = new AudioCtx()
      }
    }
  }

  // mulai sirine alarm keras
  startAlarm() {
    if (typeof window === "undefined") return
    try {
      this.initAudio()
      if (!this.audioContext) return

      if (this.audioContext.state === "suspended") {
        this.audioContext.resume()
      }

      this.stopAlarm() // reset jika sedang jalan

      // gain node pengatur volume
      this.gainNode = this.audioContext.createGain()
      this.gainNode.gain.setValueAtTime(this.isMuted ? 0 : 0.85, this.audioContext.currentTime)
      this.gainNode.connect(this.audioContext.destination)

      // osilator nada utama sirine
      this.oscillator1 = this.audioContext.createOscillator()
      this.oscillator1.type = "sawtooth"
      this.oscillator1.frequency.setValueAtTime(700, this.audioContext.currentTime)
      this.oscillator1.connect(this.gainNode)
      this.oscillator1.start()

      // osilator kedua penambah efek tajam
      this.oscillator2 = this.audioContext.createOscillator()
      this.oscillator2.type = "sine"
      this.oscillator2.frequency.setValueAtTime(900, this.audioContext.currentTime)
      this.oscillator2.connect(this.gainNode)
      this.oscillator2.start()

      let toggle = false
      this.sirenInterval = setInterval(() => {
        if (!this.oscillator1 || !this.audioContext) return
        const now = this.audioContext.currentTime
        const targetFreq1 = toggle ? 960 : 640
        const targetFreq2 = toggle ? 1200 : 800
        this.oscillator1.frequency.setTargetAtTime(targetFreq1, now, 0.08)
        this.oscillator2.frequency.setTargetAtTime(targetFreq2, now, 0.08)
        toggle = !toggle
      }, 350)

      this.isAudioPlaying = true
    } catch (err) {
      console.warn("gagal memutar audio synth:", err)
    }
  }

  // hentikan alarm sirine
  stopAlarm() {
    if (this.sirenInterval) {
      clearInterval(this.sirenInterval)
      this.sirenInterval = null
    }

    try {
      if (this.oscillator1) {
        this.oscillator1.stop()
        this.oscillator1.disconnect()
        this.oscillator1 = null
      }
      if (this.oscillator2) {
        this.oscillator2.stop()
        this.oscillator2.disconnect()
        this.oscillator2 = null
      }
      if (this.gainNode) {
        this.gainNode.disconnect()
        this.gainNode = null
      }
    } catch (e) {
      // ignore
    }

    this.isAudioPlaying = false
  }

  // toggle bisukan suara alarm
  toggleMute(shouldMute) {
    this.isMuted = typeof shouldMute === "boolean" ? shouldMute : !this.isMuted
    if (this.gainNode && this.audioContext) {
      const now = this.audioContext.currentTime
      this.gainNode.gain.setValueAtTime(this.isMuted ? 0 : 0.85, now)
    }
    return this.isMuted
  }

  // ambil kontak tepercaya
  getTrustedContacts() {
    if (typeof window === "undefined") return DEFAULT_TRUSTED_CONTACTS
    try {
      const saved = localStorage.getItem(SOS_STORAGE_KEYS.CONTACTS)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch (e) {
      console.error("gagal load kontak:", e)
    }
    return DEFAULT_TRUSTED_CONTACTS
  }

  // simpan kontak tepercaya
  saveTrustedContacts(contacts) {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(SOS_STORAGE_KEYS.CONTACTS, JSON.stringify(contacts))
    } catch (e) {
      console.error("gagal save kontak:", e)
    }
  }

  // ambil posisi gps terkini
  async getCurrentLocation() {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !navigator.geolocation) {
        resolve({
          success: false,
          error: "GEOLOCATION_UNSUPPORTED",
          coords: [106.8105, -6.2307], // fallback jakarta selatan
        })
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            success: true,
            coords: [position.coords.longitude, position.coords.latitude],
            accuracy: position.coords.accuracy,
          })
        },
        (error) => {
          let errorType = "UNKNOWN_ERROR"
          if (error.code === error.PERMISSION_DENIED) errorType = "PERMISSION_DENIED"
          if (error.code === error.POSITION_UNAVAILABLE) errorType = "POSITION_UNAVAILABLE"
          if (error.code === error.TIMEOUT) errorType = "TIMEOUT"

          resolve({
            success: false,
            error: errorType,
            coords: [106.8105, -6.2307], // fallback aman
          })
        },
        {
          enableHighAccuracy: true,
          timeout: 7000,
          maximumAge: 10000,
        }
      )
    })
  }

  // format pesan darurat teks
  generateEmergencyMessage(coords, hasGps = true) {
    const timeStr = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    const dateStr = new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })

    if (!hasGps || !coords) {
      return `🚨 [EMERGENCY SOS ALERT]\nSaya dalam kondisi bahaya dan butuh bantuan segera!\n\n⚠️ Lokasi GPS tidak dapat diakses saat ini.\n🕒 Waktu: ${timeStr} WIB, ${dateStr}\n\nMohon segera hubungi saya atau kirim bantuan!`
    }

    const [lng, lat] = coords
    const mapLink = `https://www.google.com/maps?q=${lat},${lng}`

    return `🚨 [EMERGENCY SOS ALERT]\nSaya dalam kondisi bahaya dan butuh bantuan segera!\n\n📍 Lokasi Terkini:\n${mapLink}\n🕒 Waktu: ${timeStr} WIB, ${dateStr}\n\nMohon segera hubungi saya atau kirim bantuan ke titik ini!`
  }

  // buat link share whatsapp
  generateWhatsAppLink(phoneNumber, message) {
    const cleanedPhone = phoneNumber.replace(/[^0-9]/g, "")
    const encodedMsg = encodeURIComponent(message)
    return `https://api.whatsapp.com/send?phone=${cleanedPhone}&text=${encodedMsg}`
  }

  // simulasi kirim broadcast
  async dispatchSosToContacts(contacts, coords, hasGps = true, isOnline = true) {
    const message = this.generateEmergencyMessage(coords, hasGps)

    // simpan ke riwayat darurat
    this.saveSosHistory({
      timestamp: Date.now(),
      coords,
      hasGps,
      isOnline,
      contactsCount: contacts.length,
    })

    // jika offline, simpan ke antrean
    if (!isOnline) {
      this.addToOfflineQueue({
        timestamp: Date.now(),
        message,
        contacts,
      })
      return contacts.map((c) => ({
        contactId: c.id,
        status: "queued",
        statusLabel: "Tertunda (Offline)",
      }))
    }

    // simulasi dispatch bertahap
    return contacts.map((c) => ({
      contactId: c.id,
      status: "delivered",
      statusLabel: "Terkirim",
      phone: c.phone,
      waLink: this.generateWhatsAppLink(c.phone, message),
    }))
  }

  // simpan antrean offline
  addToOfflineQueue(queueItem) {
    if (typeof window === "undefined") return
    try {
      const raw = localStorage.getItem(SOS_STORAGE_KEYS.OFFLINE_QUEUE)
      const list = raw ? JSON.parse(raw) : []
      list.push(queueItem)
      localStorage.setItem(SOS_STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(list))
    } catch (e) {
      console.warn("gagal antre offline:", e)
    }
  }

  // bersihkan antrean offline
  getAndClearOfflineQueue() {
    if (typeof window === "undefined") return []
    try {
      const raw = localStorage.getItem(SOS_STORAGE_KEYS.OFFLINE_QUEUE)
      if (raw) {
        localStorage.removeItem(SOS_STORAGE_KEYS.OFFLINE_QUEUE)
        return JSON.parse(raw)
      }
    } catch (e) {
      console.warn("gagal flush queue:", e)
    }
    return []
  }

  // simpan log history sos
  saveSosHistory(record) {
    if (typeof window === "undefined") return
    try {
      const raw = localStorage.getItem(SOS_STORAGE_KEYS.HISTORY)
      const list = raw ? JSON.parse(raw) : []
      list.unshift(record)
      localStorage.setItem(SOS_STORAGE_KEYS.HISTORY, JSON.stringify(list.slice(0, 20)))
    } catch (e) {
      // ignore
    }
  }

  // hitung jarak safe point terdekat
  calculateDistanceMeters(coord1, coord2) {
    if (!coord1 || !coord2) return 999
    const [lon1, lat1] = coord1
    const [lon2, lat2] = coord2
    const R = 6371e3
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return Math.round(R * c)
  }

  // ambil safe point terdekat
  getNearbySafePoints(userCoords) {
    if (!userCoords) return MOCK_NEARBY_SAFE_POINTS

    return MOCK_NEARBY_SAFE_POINTS.map((sp) => {
      const distanceMeters = this.calculateDistanceMeters(userCoords, sp.coordinates)
      const walkingTimeMinutes = Math.max(1, Math.round(distanceMeters / 80))
      return {
        ...sp,
        distanceMeters,
        walkingTimeMinutes,
      }
    }).sort((a, b) => a.distanceMeters - b.distanceMeters)
  }
}

export const sosService = new SosService()
