"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faHouse as faHouseSolid, faLocationDot as faLocationDotSolid, faUser as faUserSolid } from "@fortawesome/free-solid-svg-icons"
import { faHouse as faHouseRegular, faUser as faUserRegular } from "@fortawesome/free-regular-svg-icons"
import { HatGlasses, Megaphone, MapPin } from "lucide-react"

const byPrefixAndName = {
  fas: {
    house: faHouseSolid,
    "location-dot": faLocationDotSolid,
    user: faUserSolid,
  },
  far: {
    house: faHouseRegular,
    user: faUserRegular,
  },
}

export function MobileBottomNav() {
  const pathname = usePathname()

  // Sembunyikan bottom navigation di landing page, login, dan register
  if (
    !pathname ||
    pathname === "/" ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register")
  ) {
    return null
  }

  const navItems = [
    {
      id: "home",
      label: "Home",
      href: "/",
      isActive: pathname === "/",
      renderIcon: (isActive) => (
        <FontAwesomeIcon
          icon={isActive ? byPrefixAndName.fas["house"] : byPrefixAndName.far["house"]}
          style={{ color: isActive ? "var(--primary, #F02E65)" : "rgb(156, 163, 175)" }}
          className="w-5 h-5 text-lg"
        />
      ),
    },
    {
      id: "report",
      label: "Report",
      href: "/anonymous-report",
      isActive: pathname.startsWith("/anonymous-report"),
      renderIcon: (isActive) => (
        <HatGlasses
          className={`w-5 h-5 ${
            isActive
              ? "stroke-[2.2] text-primary fill-primary/20"
              : "stroke-[1.75] text-neutral-400"
          }`}
        />
      ),
    },
    {
      id: "sos",
      label: "SOS",
      href: "/sos",
      isActive: pathname.startsWith("/sos"),
      renderIcon: (isActive) => (
        <Megaphone
          className={`w-5 h-5 ${
            isActive
              ? "stroke-[2.2] text-primary fill-primary/20"
              : "stroke-[1.75] text-neutral-400"
          }`}
        />
      ),
    },
    {
      id: "safe-route",
      label: "Safe Route",
      href: "/safe-route",
      isActive: pathname.startsWith("/safe-route"),
      renderIcon: (isActive) => (
        isActive ? (
          <FontAwesomeIcon
            icon={byPrefixAndName.fas["location-dot"]}
            style={{ color: "var(--primary, #F02E65)" }}
            className="w-5 h-5 text-lg"
          />
        ) : (
          <MapPin
            className="w-5 h-5 stroke-[1.75] text-neutral-400"
          />
        )
      ),
    },
    {
      id: "profile",
      label: "Profil",
      href: "/profile",
      isActive: pathname.startsWith("/profile"),
      renderIcon: (isActive) => (
        <FontAwesomeIcon
          icon={isActive ? byPrefixAndName.fas["user"] : byPrefixAndName.far["user"]}
          style={{ color: isActive ? "var(--primary, #F02E65)" : "rgb(156, 163, 175)" }}
          className="w-5 h-5 text-lg"
        />
      ),
    },
  ]

  return (
    <nav
      aria-label="Navigasi Bawah Mobile"
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-neutral-200/70 shadow-[0_-2px_12px_rgba(0,0,0,0.05)] select-none"
    >
      <div className="flex items-stretch justify-around max-w-lg mx-auto h-15">
        {navItems.map((item) => {
          const isActive = item.isActive

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`relative flex-1 h-full flex flex-col items-center justify-center gap-0.5 transition-colors duration-150 focus:outline-none ${
                isActive
                  ? "bg-primary/[0.07]"
                  : "hover:bg-neutral-50 active:bg-neutral-100"
              }`}
            >
              {/* Garis Bar Indikator Aktif di Atas */}
              {isActive && (
                <div className="absolute top-0 left-2 right-2 h-[3px] bg-primary rounded-b-md" />
              )}

              {/* Icon Container */}
              <div
                className="relative flex items-center justify-center pt-1 transition-transform active:scale-90"
              >
                {item.renderIcon(isActive)}
              </div>

              {/* Label Teks - Semibold */}
              <span
                className={`text-[11px] tracking-tight leading-tight font-semibold ${
                  isActive
                    ? "text-neutral-800"
                    : "text-neutral-400"
                }`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
