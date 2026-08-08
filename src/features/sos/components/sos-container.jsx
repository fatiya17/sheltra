"use client"
import React, { useState, useEffect } from "react"
import { useSos } from "../hooks/use-sos"
import { SosHoldButton } from "./sos-hold-button"
import { EmergencyHotlinesSection } from "./emergency-hotlines-section"
import { SafePointsSection } from "./safe-points-section"
import { SosActiveView } from "./sos-active-view"

export default function SosContainer() {
  const {
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
    startHolding,
    stopHolding,
    cancelSos,
    toggleMute,
  } = useSos()

  // state untuk active tab sos
  const [activeTab, setActiveTab] = useState("main")

  // reset tab saat sos dimatikan
  useEffect(() => {
    if (status !== "active") {
      setActiveTab("main")
    }
  }, [status])

  // =========================================================================
  // 1. TAMPILAN JIKA SOS AKTIF
  // =========================================================================
  if (status === "active") {
    return (
      <div className="w-full">
        {/* mobile view */}
        <div className={`${activeTab === "safepoint" ? "" : "p-4"} lg:hidden`}>
          <SosActiveView
            desktopEmbedded={false}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            activeDurationSeconds={activeDurationSeconds}
            isAlarmPlaying={isAlarmPlaying}
            isMuted={isMuted}
            onToggleMute={toggleMute}
            onCancelSos={cancelSos}
            trustedContacts={trustedContacts}
            dispatchResults={dispatchResults}
            userLocation={userLocation}
            safePoints={safePoints}
            isOnline={isOnline}
          />
        </div>

        {/* desktop view */}
        {activeTab === "safepoint" ? (
          // sembunyikan safe points terdekat saat navigasi rute
          <div className="hidden lg:block w-full h-[650px] relative mt-16 px-6 md:px-8">
            <SosActiveView
              desktopEmbedded
              hideDesktopSos
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              activeDurationSeconds={activeDurationSeconds}
              isAlarmPlaying={isAlarmPlaying}
              isMuted={isMuted}
              onToggleMute={toggleMute}
              onCancelSos={cancelSos}
              trustedContacts={trustedContacts}
              dispatchResults={dispatchResults}
              userLocation={userLocation}
              safePoints={safePoints}
              isOnline={isOnline}
            />
          </div>
        ) : (
          // layout default active sos: 2 kolom
          <div className="hidden lg:grid grid-cols-[minmax(0,1fr)_340px] items-start gap-6 w-full p-6 md:px-8 pt-24">
            <SosActiveView
              desktopEmbedded
              hideDesktopSos
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              activeDurationSeconds={activeDurationSeconds}
              isAlarmPlaying={isAlarmPlaying}
              isMuted={isMuted}
              onToggleMute={toggleMute}
              onCancelSos={cancelSos}
              trustedContacts={trustedContacts}
              dispatchResults={dispatchResults}
              userLocation={userLocation}
              safePoints={safePoints}
              isOnline={isOnline}
            />
            <div className="sticky top-6">
              <SafePointsSection safePoints={safePoints} userCoords={userLocation.coords} />
            </div>
          </div>
        )}
        {/* Indikator SOS desktop tetap terlihat tanpa mengganggu detail aktif. */}
        <ActiveSosIndicator />
      </div>
    )
  }

  // =========================================================================
  // 2. TAMPILAN SIAGA SOS (IDLE)
  // =========================================================================
  return (
    <div className="w-full p-4 md:px-8 md:py-6 flex items-center min-h-[80vh] lg:min-h-[70vh] pb-24 md:pb-6">
      {/* 
        Layout Desktop: 3 kolom — bantuan cepat, tombol SOS, titik aman.
        Layout Mobile: hanya tombol SOS (panel samping disembunyikan)
      */}
      <div className="flex flex-col lg:grid lg:grid-cols-[340px_minmax(0,1fr)_340px] lg:items-start gap-6 w-full">
        
        {/* Kolom kiri: bantuan cepat — desktop saja */}
        <div className="hidden lg:block w-full order-1 lg:sticky lg:top-6">
          <EmergencyHotlinesSection />
        </div>

        {/* Kolom tengah: tombol SOS */}
        <div className="w-full flex justify-center items-center py-8 lg:py-0 order-2 lg:self-center">
          <SosHoldButton
            onStartHold={startHolding}
            onEndHold={stopHolding}
            holdProgress={holdProgress}
            isHolding={status === "holding"}
          />
        </div>

        {/* Kolom kanan: titik aman — desktop saja */}
        <div className="hidden lg:block w-full order-3 lg:sticky lg:top-6">
          <SafePointsSection safePoints={safePoints} userCoords={userLocation.coords} />
        </div>
        
      </div>
    </div>
  )
}

function ActiveSosIndicator() {
  return (
    <div className="hidden lg:flex fixed bottom-6 left-6 z-50 w-16 h-16 items-center justify-center">
      <span className="absolute inset-0 rounded-full bg-[#e62058]/35 animate-ping" />
      <span className="absolute -inset-2 rounded-full border-2 border-[#e62058]/35 animate-pulse" />
      <div
        className="relative w-14 h-14 rounded-full bg-[#e62058] text-white shadow-[0_8px_22px_rgba(230,32,88,0.45)] flex items-center justify-center text-sm font-black"
        role="status"
        aria-label="SOS aktif"
      >
        SOS
      </div>
    </div>
  )
}
