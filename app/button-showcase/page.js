"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  ArrowRight, 
  Plus, 
  Mail, 
  ArrowUpRight, 
  Loader2, 
  Settings, 
  Trash, 
  Check, 
  Sparkles,
  ArrowLeft,
  MousePointerClick
} from "lucide-react"

export default function ButtonShowcase() {
  const [clickCount, setClickCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isDisabled, setIsDisabled] = useState(false)

  const handleTestClick = () => {
    setClickCount((prev) => prev + 1)
  }

  const toggleLoading = () => {
    setIsLoading((prev) => !prev)
  }

  const toggleDisabled = () => {
    setIsDisabled((prev) => !prev)
  }

  return (
    <main className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 py-12 px-4 md:px-8 flex flex-col items-center">
      {/* Header section with modern design */}
      <div className="w-full max-w-5xl mb-12 text-center relative p-8 rounded-3xl bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-xs">
        <div className="absolute top-4 left-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Beranda
            </Button>
          </Link>
        </div>
        <div className="inline-flex p-3 rounded-2xl bg-primary/20 text-primary-foreground mb-4">
          <Sparkles className="w-6 h-6 text-pink-600 dark:text-pink-400 animate-pulse" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl font-heading">
          Radix UI Button Showcase
        </h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Eksplorasi visual seluruh varian, ukuran, dan status interaktif dari komponen Button berbasis Radix UI & Shadcn.
        </p>
        <div className="mt-6 flex justify-center gap-4 flex-wrap">
          <Link href="/badge-showcase">
            <Button variant="outline" size="sm" className="gap-1.5">
              Badge Showcase
              <ArrowUpRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/lightbox-showcase">
            <Button variant="outline" size="sm" className="gap-1.5">
              Lightbox Showcase
              <ArrowUpRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/form-showcase">
            <Button variant="outline" size="sm" className="gap-1.5">
              Form Showcase
              <ArrowUpRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/map-showcase">
            <Button variant="outline" size="sm" className="gap-1.5">
              Map Showcase
              <ArrowUpRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="w-full max-w-5xl space-y-8">
        
        {/* Interactive Testing Playground */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/30 text-pink-600">
              <MousePointerClick className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Playground Interaktif</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Control Panel */}
            <div className="space-y-4 bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-900">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Pengaturan State</h3>
              <div className="flex flex-col gap-2">
                <Button 
                  variant={isLoading ? "default" : "outline"} 
                  size="sm" 
                  onClick={toggleLoading}
                  className="w-full justify-between"
                >
                  <span>Toggle Loading State</span>
                  <span className={`w-2.5 h-2.5 rounded-full ${isLoading ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                </Button>
                <Button 
                  variant={isDisabled ? "default" : "outline"} 
                  size="sm" 
                  onClick={toggleDisabled}
                  className="w-full justify-between"
                >
                  <span>Toggle Disabled State</span>
                  <span className={`w-2.5 h-2.5 rounded-full ${isDisabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                </Button>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-center">
                <p className="text-xs text-slate-500">
                  Total Klik Uji Coba: <strong className="text-pink-600 dark:text-pink-400 text-sm">{clickCount}</strong>
                </p>
              </div>
            </div>

            {/* Playground Live Target */}
            <div className="md:col-span-2 flex flex-wrap gap-4 items-center justify-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl min-h-[160px]">
              <Button 
                variant="default" 
                disabled={isDisabled}
                onClick={handleTestClick}
                className="shadow-sm"
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Default Variant
              </Button>
              
              <Button 
                variant="outline" 
                disabled={isDisabled}
                onClick={handleTestClick}
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Outline Variant
              </Button>

              <Button 
                variant="destructive" 
                disabled={isDisabled}
                onClick={handleTestClick}
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Destructive Variant
              </Button>
            </div>
          </div>
        </section>

        {/* 1. Core Variants Showcase */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Varian Utama (Core Variants)</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Enam varian visual yang dirancang untuk menyampaikan tingkat kepentingan aksi berbeda.</p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="flex flex-col items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 text-center gap-4">
              <Button variant="default">Default</Button>
              <span className="text-[11px] font-medium text-slate-400 uppercase">Default</span>
            </div>

            <div className="flex flex-col items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 text-center gap-4">
              <Button variant="outline">Outline</Button>
              <span className="text-[11px] font-medium text-slate-400 uppercase">Outline</span>
            </div>

            <div className="flex flex-col items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 text-center gap-4">
              <Button variant="secondary">Secondary</Button>
              <span className="text-[11px] font-medium text-slate-400 uppercase">Secondary</span>
            </div>

            <div className="flex flex-col items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 text-center gap-4">
              <Button variant="ghost">Ghost</Button>
              <span className="text-[11px] font-medium text-slate-400 uppercase">Ghost</span>
            </div>

            <div className="flex flex-col items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 text-center gap-4">
              <Button variant="destructive">Destructive</Button>
              <span className="text-[11px] font-medium text-slate-400 uppercase">Destructive</span>
            </div>

            <div className="flex flex-col items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 text-center gap-4">
              <Button variant="link">Link Style</Button>
              <span className="text-[11px] font-medium text-slate-400 uppercase">Link</span>
            </div>
          </div>
        </section>

        {/* 2. Sizing Showcase */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Ukuran Komponen (Sizes)</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Seluruh button teks sekarang memiliki ukuran padding yang seragam sebesar 8px 12px (py-2 px-3), sehingga tinggi tombol menyesuaikan secara dinamis.</p>
          
          <div className="space-y-6">
            {/* Standard Sizes */}
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Ukuran Standar</h3>
              <div className="flex flex-wrap items-end gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900">
                <div className="flex flex-col items-center gap-2">
                  <Button size="xs">Extra Small (xs)</Button>
                  <span className="text-[10px] text-slate-400">h-8 (32px)</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Button size="sm">Small (sm)</Button>
                  <span className="text-[10px] text-slate-400">h-8.5 (34px)</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Button size="default">Default</Button>
                  <span className="text-[10px] text-slate-400">h-9 (36px)</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Button size="lg">Large (lg)</Button>
                  <span className="text-[10px] text-slate-400">h-9 (36px)</span>
                </div>
              </div>
            </div>

            {/* Icon-Only Sizes */}
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Ukuran Khusus Ikon (Icon Only)</h3>
              <div className="flex flex-wrap items-end gap-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900">
                <div className="flex flex-col items-center gap-2">
                  <Button size="icon-xs" variant="outline">
                    <Settings className="w-3.5 h-3.5" />
                  </Button>
                  <span className="text-[10px] text-slate-400">xs (32px)</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Button size="icon-sm" variant="outline">
                    <Settings className="w-4 h-4" />
                  </Button>
                  <span className="text-[10px] text-slate-400">sm (38px)</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Button size="icon" variant="outline">
                    <Settings className="w-4 h-4" />
                  </Button>
                  <span className="text-[10px] text-slate-400">default (44px)</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Button size="icon-lg" variant="outline">
                    <Settings className="w-5 h-5" />
                  </Button>
                  <span className="text-[10px] text-slate-400">lg (56px)</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2.5 Font Sizes Showcase */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Ukuran Font (Font Sizes)</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Pilihan ukuran font untuk Button yang dapat disesuaikan menggunakan prop fontSize.</p>
          
          <div className="flex flex-wrap items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900">
            <div className="flex flex-col items-center gap-2">
              <Button fontSize="xs">Extra Small (xs)</Button>
              <span className="text-[10px] text-slate-400">fontSize="xs"</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Button fontSize="default">Default / Small (sm)</Button>
              <span className="text-[10px] text-slate-400">fontSize="default"</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Button fontSize="base">Base (base)</Button>
              <span className="text-[10px] text-slate-400">fontSize="base"</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Button fontSize="lg">Large (lg)</Button>
              <span className="text-[10px] text-slate-400">fontSize="lg"</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Button fontSize="xl">Extra Large (xl)</Button>
              <span className="text-[10px] text-slate-400">fontSize="xl"</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Button fontSize="2xl">2X Large (2xl)</Button>
              <span className="text-[10px] text-slate-400">fontSize="2xl"</span>
            </div>
          </div>
        </section>

        {/* 3. States & Styling Customizations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Icons & Rounded */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Ikon & Kustomisasi Sudut</h2>
            <p className="text-xs text-slate-500 mb-6">Penerapan ikon Lucide dan modifikasi sudut melingkar penuh (rounded-full).</p>
            
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button className="gap-2">
                  <Mail className="w-4 h-4" />
                  Kirim Email
                </Button>
                <Button variant="outline" className="gap-2">
                  Detail Aksi
                  <ArrowUpRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button className="rounded-full gap-2">
                  <Plus className="w-4 h-4" />
                  Tambah Baru
                </Button>
                <Button variant="destructive" className="rounded-full gap-2">
                  <Trash className="w-4 h-4" />
                  Hapus Data
                </Button>
              </div>
            </div>
          </section>

          {/* Spinner, Loading & Disabled */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Spinner & Disabled States</h2>
            <p className="text-xs text-slate-500 mb-6">Indikator proses memuat (loading) dan tombol nonaktif (disabled).</p>
            
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button disabled className="gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memproses...
                </Button>
                <Button variant="secondary" disabled>
                  Tidak Dapat Diklik
                </Button>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button variant="outline" className="gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Sinkronisasi
                </Button>
              </div>
            </div>
          </section>

        </div>

        {/* 4. Advanced Scenarios: Groups & AsChild */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Skenario Lanjutan (Advanced Layouts)</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Kelompok tombol (Button Group) dan rendering kustom menggunakan pola AsChild Radix UI.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Button Group Showcase */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Button Group</h3>
              <div className="inline-flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 divide-x divide-slate-200 dark:divide-slate-800 shadow-xs">
                <Button variant="ghost" size="sm" className="rounded-none hover:bg-slate-100 dark:hover:bg-slate-800">
                  Hari Ini
                </Button>
                <Button variant="ghost" size="sm" className="rounded-none hover:bg-slate-100 dark:hover:bg-slate-800">
                  Mingguan
                </Button>
                <Button variant="ghost" size="sm" className="rounded-none hover:bg-slate-100 dark:hover:bg-slate-800">
                  Bulanan
                </Button>
              </div>
            </div>

            {/* As Child Wrapper */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">As Child (Tautan Navigasi)</h3>
              <div>
                <Button asChild variant="outline" className="gap-2 shadow-xs">
                  <Link href="/">
                    Kembali ke Form Utama
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

      </div>
    </main>
  )
}
