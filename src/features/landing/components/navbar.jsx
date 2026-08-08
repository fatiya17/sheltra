"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/context/auth-context";

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="sticky top-0 w-full bg-white border-b border-gray-100 z-50">
      <nav className="flex items-center justify-between px-6 md:px-8 py-3.5">
        {/* logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl md:text-2xl font-semibold text-primary tracking-tight">Sheltra</span>
          </Link>
        </div>

        {/* navigasi desktop */}
        <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          {isAuthenticated ? (
            <>
              <Link
                href="/safe-route"
                className="text-[15px] font-medium text-black hover:text-primary transition shrink-0"
              >
                Safe Route
              </Link>
              <Link
                href="/anonymous-report"
                className="text-[15px] font-medium text-black hover:text-primary transition shrink-0"
              >
                Report
              </Link>
              <Link
                href="/sos"
                className="text-[15px] font-medium text-black hover:text-primary transition shrink-0"
              >
                SOS
              </Link>
              <Link
                href="/heatmap"
                className="text-[15px] font-medium text-black hover:text-primary transition shrink-0"
              >
                Heatmap
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/#hero"
                className="text-[15px] font-medium text-black hover:text-primary transition shrink-0"
              >
                Home
              </Link>
              <Link
                href="/#features"
                className="text-[15px] font-medium text-black hover:text-primary transition shrink-0"
              >
                Fitur Utama
              </Link>
              <Link
                href="/#about"
                className="text-[15px] font-medium text-black hover:text-primary transition shrink-0"
              >
                Tentang Kami
              </Link>
              <Link
                href="/#how-it-works"
                className="text-[15px] font-medium text-black hover:text-primary transition shrink-0"
              >
                Cara Kerja
              </Link>
            </>
          )}
        </div>

        {/* tombol aksi desktop */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="hidden md:flex items-center gap-3">
              {/* link profile user */}
              <Link
                href="/profile"
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-full hover:bg-neutral-50 transition border border-transparent hover:border-neutral-200"
              >
                <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center border border-pink-200 ${user?.avatar?.bg || "bg-pink-100"}`}>
                  {user?.avatar?.url ? (
                    <img
                      src={user.avatar.url}
                      alt={user?.name || "User Avatar"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-4 h-4 text-primary" />
                  )}
                </div>
                <span className="text-sm font-semibold text-neutral-800 max-w-[120px] truncate">
                  {user?.name || "Profil"}
                </span>
              </Link>

              {/* tombol logout */}
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-neutral-500 hover:text-rose-600 hover:bg-rose-50 rounded-full px-3 text-xs"
              >
                <LogOut className="w-3.5 h-3.5 mr-1" />
                Keluar
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2.5">
              <Link href="/sign-in">
                <Button
                  variant="primary"
                  className="font-medium px-5 h-9"
                >
                  Masuk
                </Button>
              </Link>
            </div>
          )}

          {/* tombol hamburger mobile */}
          <button
            className="flex md:hidden text-black hover:text-primary transition p-1"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" strokeWidth={2} /> : <Menu className="w-6 h-6" strokeWidth={2} />}
          </button>
        </div>
      </nav>

      {/* dropdown menu mobile */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-gray-100 flex flex-col px-6 py-6 gap-4 shadow-md z-40">
          {isAuthenticated ? (
            <>
              {/* profile header mobile */}
              <Link
                href="/profile"
                className="flex items-center gap-3 p-3 rounded-xl bg-pink-50/60 border border-pink-100"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center border border-pink-200 ${user?.avatar?.bg || "bg-pink-100"}`}>
                  {user?.avatar?.url ? (
                    <img
                      src={user.avatar.url}
                      alt={user?.name || "User Avatar"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 truncate">{user?.name || "User"}</p>
                  <p className="text-xs text-neutral-500 truncate">{user?.email || "Lihat profil lengkap"}</p>
                </div>
              </Link>

              <Link href="/safe-route" className="text-[15px] font-medium text-black hover:text-primary py-1" onClick={() => setIsMobileMenuOpen(false)}>
                Safe Route
              </Link>
              <Link href="/anonymous-report" className="text-[15px] font-medium text-black hover:text-primary py-1" onClick={() => setIsMobileMenuOpen(false)}>
                Report
              </Link>
              <Link href="/sos" className="text-[15px] font-medium text-black hover:text-primary py-1" onClick={() => setIsMobileMenuOpen(false)}>
                SOS
              </Link>
              <Link href="/heatmap" className="text-[15px] font-medium text-black hover:text-primary py-1" onClick={() => setIsMobileMenuOpen(false)}>
                Heatmap
              </Link>
              <Link href="/profile" className="text-[15px] font-medium text-black hover:text-primary py-1" onClick={() => setIsMobileMenuOpen(false)}>
                Profil Saya
              </Link>

              <div className="pt-3 border-t border-gray-100">
                <Button
                  variant="outline"
                  className="w-full border-rose-200 text-rose-600 hover:bg-rose-50"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logout();
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Keluar
                </Button>
              </div>
            </>
          ) : (
            <>
              <Link href="/#hero" className="text-[15px] font-medium text-black hover:text-primary py-1" onClick={() => setIsMobileMenuOpen(false)}>
                Home
              </Link>
              <Link href="/#features" className="text-[15px] font-medium text-black hover:text-primary py-1" onClick={() => setIsMobileMenuOpen(false)}>
                Fitur Utama
              </Link>
              <Link href="/#about" className="text-[15px] font-medium text-black hover:text-primary py-1" onClick={() => setIsMobileMenuOpen(false)}>
                Tentang Kami
              </Link>
              <Link href="/#how-it-works" className="text-[15px] font-medium text-black hover:text-primary py-1" onClick={() => setIsMobileMenuOpen(false)}>
                Cara Kerja
              </Link>

              <div className="pt-4 border-t border-gray-100 flex flex-col gap-2.5">
                <Link href="/sign-in" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full font-medium">
                    Masuk
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
}