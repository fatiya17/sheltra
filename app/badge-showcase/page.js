"use client"

import React from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { 
  BadgeCheck, 
  Bookmark, 
  ArrowUpRight, 
  Loader2, 
  Sparkles, 
  ArrowLeft, 
  Star, 
  Tag, 
  Info,
  ShieldCheck
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function BadgeShowcase() {
  return (
    <main className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 py-12 px-4 md:px-8 flex flex-col items-center">
      {/* Header section */}
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
          Radix UI Badge Showcase
        </h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Eksplorasi visual seluruh varian, warna kustom, dan status dari komponen Badge berbasis Radix UI.
        </p>
        <div className="mt-6 flex justify-center gap-4 flex-wrap">
          <Link href="/button-showcase">
            <Button variant="outline" size="sm" className="gap-1.5">
              Button Showcase
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
        
        {/* 1. Core Variants Showcase */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Varian Utama (Core Variants)</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Enam varian visual bawaan Badge untuk menyampaikan maksud informasi yang berbeda.</p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="flex flex-col items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 text-center gap-4">
              <Badge variant="default">Default</Badge>
              <span className="text-[11px] font-medium text-slate-400 uppercase">Default</span>
            </div>

            <div className="flex flex-col items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 text-center gap-4">
              <Badge variant="secondary">Secondary</Badge>
              <span className="text-[11px] font-medium text-slate-400 uppercase">Secondary</span>
            </div>

            <div className="flex flex-col items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 text-center gap-4">
              <Badge variant="destructive">Destructive</Badge>
              <span className="text-[11px] font-medium text-slate-400 uppercase">Destructive</span>
            </div>

            <div className="flex flex-col items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 text-center gap-4">
              <Badge variant="outline">Outline</Badge>
              <span className="text-[11px] font-medium text-slate-400 uppercase">Outline</span>
            </div>

            <div className="flex flex-col items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 text-center gap-4">
              <Badge variant="ghost">Ghost</Badge>
              <span className="text-[11px] font-medium text-slate-400 uppercase">Ghost</span>
            </div>

            <div className="flex flex-col items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 text-center gap-4">
              <Badge variant="link">Link Style</Badge>
              <span className="text-[11px] font-medium text-slate-400 uppercase">Link</span>
            </div>
          </div>
        </section>

        {/* 2. Custom Color Variants & Categories */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Tag Kategori & Warna Kustom (Badge Category Tags)</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Penerapan Badge dengan sembilan varian warna kustom berbeda menggunakan prop label.</p>
          
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900">
            <div className="flex flex-col gap-6">
              {/* Teams Section */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Teams
                </span>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="blue" label="Design" />
                  <Badge variant="cyan" label="DevOps" />
                  <Badge variant="green" label="Backend" />
                  <Badge variant="pink" label="Marketing" />
                  <Badge variant="purple" label="Engineering" />
                  <Badge variant="teal" label="Research" />
                </div>
              </div>

              {/* Priority Section */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Priority
                </span>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="orange" label="Urgent" />
                  <Badge variant="red" label="Critical" />
                  <Badge variant="yellow" label="Review" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Badge with Icons and Spinners */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Badge with Icons */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Badge dengan Ikon (With Icon)</h2>
            <p className="text-xs text-slate-500 mb-6">Penerapan ikon di sisi awal (inline-start) atau sisi akhir (inline-end).</p>
            
            <div className="flex flex-wrap gap-4 items-center justify-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl min-h-[120px]">
              <Badge variant="default" className="gap-1.5" data-icon="inline-start">
                <BadgeCheck className="w-3.5 h-3.5" />
                Verified
              </Badge>

              <Badge variant="secondary" className="gap-1.5" data-icon="inline-start">
                <Bookmark className="w-3.5 h-3.5" />
                Bookmark
              </Badge>

              <Badge variant="outline" className="gap-1.5" data-icon="inline-end">
                Trending
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              </Badge>
            </div>
          </section>

          {/* Badge with Spinner */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Badge dengan Spinner (With Spinner)</h2>
            <p className="text-xs text-slate-500 mb-6">Penggunaan animasi spinner untuk menandakan status proses/pemuatan data.</p>
            
            <div className="flex flex-wrap gap-4 items-center justify-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl min-h-[120px]">
              <Badge variant="destructive" className="gap-1.5" data-icon="inline-start">
                <Loader2 className="w-3 h-3 animate-spin" />
                Deleting
              </Badge>

              <Badge variant="default" className="gap-1.5" data-icon="inline-start">
                <Loader2 className="w-3 h-3 animate-spin" />
                Generating
              </Badge>

              <Badge variant="secondary" className="gap-1.5" data-icon="inline-end">
                Uploading
                <Loader2 className="w-3 h-3 animate-spin text-primary" />
              </Badge>
            </div>
          </section>

        </div>

        {/* 4. Link & As Child Pattern */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Pola As Child (Link Render)</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Rendering tag anchor / tautan kustom menggunakan pattern asChild Radix UI.</p>
          
          <div className="flex justify-center p-6 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl">
            <Badge asChild variant="outline" className="cursor-pointer">
              <a href="https://shadcn.com" target="_blank" rel="noopener noreferrer">
                Open Link
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </Badge>
          </div>
        </section>

      </div>
    </main>
  )
}
