"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 w-full bg-white border-b border-gray-100 z-50">
      <nav className="flex items-center justify-between px-6 md:px-8 py-4">
        {/* logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2">
            {/* <Image
              src="/assets/logo.png"
              alt="Sheltra Logo"
              width={32}
              height={32}
              className="w-8 h-8 object-contain"
            /> */}
            <span className="text-xl md:text-2xl font-semibold text-primary tracking-tight">Sheltra</span>
          </Link>
        </div>

        {/* navigasi desktop */}
        <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
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
        </div>

        {/* tombol aksi */}
        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="hidden md:flex">
            <Button variant="default">Masuk</Button>
          </Link>

          {/* tombol menu mobile */}
          <button
            className="flex md:hidden text-black hover:text-primary transition"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" strokeWidth={2} /> : <Menu className="w-6 h-6" strokeWidth={2} />}
          </button>
        </div>
      </nav>

      {/* menu dropdown mobile */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-gray-100 flex flex-col px-6 py-6 gap-5 shadow-sm z-40">
          <Link href="/safe-route" className="text-[15px] font-medium text-black hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>
            Safe Route
          </Link>
          <Link href="/anonymous-report" className="text-[15px] font-medium text-black hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>
            Report
          </Link>
          <Link href="/sos" className="text-[15px] font-medium text-black hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>
            SOS
          </Link>
          <Link href="/heatmap" className="text-[15px] font-medium text-black hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>
            Heatmap
          </Link>

          <div className="pt-4 border-t border-gray-100">
            <Link href="/sign-in" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="default" className="w-full">Masuk</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}