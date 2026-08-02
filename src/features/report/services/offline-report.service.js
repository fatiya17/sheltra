const DB_NAME = "SafeReportOfflineDB"
const DB_VERSION = 1
const STORE_NAME = "pending_reports"
const STORAGE_KEY = "offline_incident_reports_queue"

// helper inisialisasi indexeddb
function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      resolve(null)
      return
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" })
      }
    }

    request.onsuccess = (event) => {
      resolve(event.target.result)
    }

    request.onerror = (event) => {
      console.warn("Gagal membuka IndexedDB, fallback localStorage:", event.target.error)
      resolve(null)
    }
  })
}

// helper simpan ke localstorage
function fallbackSaveLocalStorage(queue) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
  } catch (err) {
    console.warn("LocalStorage penuh atau tidak tersedia:", err)
  }
}

// helper baca dari localstorage
function fallbackGetLocalStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (err) {
    console.warn("Gagal membaca LocalStorage:", err)
    return []
  }
}

export const offlineReportService = {
  // helper cek status online
  isOnline() {
    if (typeof window === "undefined" || typeof navigator === "undefined") return true
    return navigator.onLine
  },

  // get antrean offline draft
  async getPendingReports() {
    if (typeof window === "undefined") return []

    const db = await openDatabase()
    if (!db) {
      return fallbackGetLocalStorage()
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, "readonly")
        const store = tx.objectStore(STORE_NAME)
        const request = store.getAll()

        request.onsuccess = () => {
          const results = request.result || []
          // urutkan dari yang terbaru
          results.sort((a, b) => new Date(b.queuedAt || 0) - new Date(a.queuedAt || 0))
          resolve(results)
        }

        request.onerror = () => {
          resolve(fallbackGetLocalStorage())
        }
      } catch (err) {
        console.warn("Error transaksi IndexedDB:", err)
        resolve(fallbackGetLocalStorage())
      }
    })
  },

  // save draft ke queue
  async savePendingReport(report) {
    if (typeof window === "undefined") return []

    const queuedReport = {
      ...report,
      isOfflineDraft: true,
      queuedAt: new Date().toISOString(),
    }

    const db = await openDatabase()
    if (!db) {
      const currentQueue = fallbackGetLocalStorage()
      const updatedQueue = [queuedReport, ...currentQueue.filter((item) => item.id !== report.id)]
      fallbackSaveLocalStorage(updatedQueue)
      return updatedQueue
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, "readwrite")
        const store = tx.objectStore(STORE_NAME)
        store.put(queuedReport)

        tx.oncomplete = async () => {
          const allReports = await this.getPendingReports()
          fallbackSaveLocalStorage(allReports)
          resolve(allReports)
        }

        tx.onerror = () => {
          const currentQueue = fallbackGetLocalStorage()
          const updatedQueue = [queuedReport, ...currentQueue.filter((item) => item.id !== report.id)]
          fallbackSaveLocalStorage(updatedQueue)
          resolve(updatedQueue)
        }
      } catch (err) {
        console.warn("Error simpan IndexedDB:", err)
        const currentQueue = fallbackGetLocalStorage()
        const updatedQueue = [queuedReport, ...currentQueue.filter((item) => item.id !== report.id)]
        fallbackSaveLocalStorage(updatedQueue)
        resolve(updatedQueue)
      }
    })
  },

  // remove report dari queue
  async removePendingReport(reportId) {
    if (typeof window === "undefined") return []

    const db = await openDatabase()
    if (!db) {
      const currentQueue = fallbackGetLocalStorage()
      const updatedQueue = currentQueue.filter((item) => item.id !== reportId)
      fallbackSaveLocalStorage(updatedQueue)
      return updatedQueue
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, "readwrite")
        const store = tx.objectStore(STORE_NAME)
        store.delete(reportId)

        tx.oncomplete = async () => {
          const allReports = await this.getPendingReports()
          fallbackSaveLocalStorage(allReports)
          resolve(allReports)
        }

        tx.onerror = () => {
          const currentQueue = fallbackGetLocalStorage()
          const updatedQueue = currentQueue.filter((item) => item.id !== reportId)
          fallbackSaveLocalStorage(updatedQueue)
          resolve(updatedQueue)
        }
      } catch (err) {
        console.warn("Error hapus IndexedDB:", err)
        const currentQueue = fallbackGetLocalStorage()
        const updatedQueue = currentQueue.filter((item) => item.id !== reportId)
        fallbackSaveLocalStorage(updatedQueue)
        resolve(updatedQueue)
      }
    })
  },

  // clear semua antrean draft
  async clearPendingReports() {
    if (typeof window === "undefined") return

    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (err) {
      console.warn("Gagal bersihkan LocalStorage:", err)
    }

    const db = await openDatabase()
    if (!db) return

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, "readwrite")
        const store = tx.objectStore(STORE_NAME)
        store.clear()
        tx.oncomplete = () => resolve()
        tx.onerror = () => resolve()
      } catch (err) {
        console.warn("Error clear IndexedDB:", err)
        resolve()
      }
    })
  },
}
