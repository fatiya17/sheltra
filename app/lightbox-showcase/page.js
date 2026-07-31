"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Lightbox, useLightbox } from "@/components/ui/lightbox"
import { Button } from "@/components/ui/button"
import { 
  Sparkles, 
  ArrowLeft, 
  ArrowUpRight, 
  Image as ImageIcon, 
  Play, 
  ZoomIn,
  Move
} from "lucide-react"

const GALLERY_IMAGES = [
  {
    src: 'https://lookaside.facebook.com/assets/astryx/Neutral-Backpack.png',
    alt: 'Backpack',
    caption: 'A backpack displayed on a neutral background.',
    title: 'Backpack'
  },
  {
    src: 'https://lookaside.facebook.com/assets/astryx/building.png',
    alt: 'Modern building',
    caption: 'A modern building with a contemporary architectural design.',
    title: 'Modern building'
  },
  {
    src: 'https://lookaside.facebook.com/assets/astryx/light-scene-horizontal-1.png',
    alt: 'Coastal shoreline with ocean waves',
    caption: 'A scenic coastline with waves rolling onto a sandy beach beneath a clear sky.',
    title: 'Coastal shoreline with ocean waves'
  },
  {
    src: 'https://lookaside.facebook.com/assets/astryx/illustrative-vertical-1.png',
    alt: 'Illustrated lakeside landscape at sunset',
    caption: 'A stylized landscape illustration featuring pink clouds reflected over a calm lake at sunset.',
    title: 'Illustrated lakeside landscape at sunset'
  }
]

export default function LightboxShowcase() {
  // Gallery using useLightbox hook
  const galleryLightbox = useLightbox({ media: GALLERY_IMAGES })

  // Video states
  const [videoOpen, setVideoOpen] = useState(false)

  // Zoom states
  const [zoomOpen, setZoomOpen] = useState(false)

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
          Radix UI Lightbox Showcase
        </h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Eksplorasi visual mode galeri multi-item, pemutaran video mandiri, serta kapabilitas zoom & pan gambar beresolusi tinggi.
        </p>
        <div className="mt-6 flex justify-center gap-4 flex-wrap">
          <Link href="/button-showcase">
            <Button variant="outline" size="sm" className="gap-1.5">
              Button Showcase
              <ArrowUpRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/badge-showcase">
            <Button variant="outline" size="sm" className="gap-1.5">
              Badge Showcase
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

      <div className="w-full max-w-5xl space-y-12">
        
        {/* 1. Lightbox — Gallery */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/30 text-pink-600">
              <ImageIcon className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 font-heading">Lightbox — Gallery</h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Kisi thumbnail yang meluncurkan galeri layar penuh menggunakan hook `useLightbox`. Klik thumbnail untuk membuka lightbox pada indeks yang sesuai, lalu gunakan navigasi panah kiri/kanan.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {GALLERY_IMAGES.map((img, idx) => (
              <div 
                key={idx} 
                className="group relative aspect-video md:aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 cursor-pointer shadow-xs transition-transform duration-300 hover:scale-[1.02]"
                onClick={() => galleryLightbox.open(idx)}
              >
                <img 
                  src={img.src} 
                  alt={img.alt} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <span className="text-white text-xs font-semibold">{img.title}</span>
                  <span className="text-white/70 text-[10px]">Klik untuk memperbesar</span>
                </div>
              </div>
            ))}
          </div>

          {galleryLightbox.element}
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* 2. Lightbox — Video */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/30 text-pink-600">
                  <Play className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 font-heading">Lightbox — Video</h2>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Buka video di dalam overlay lightbox dengan kontrol native pemutar video peramban. Fitur zoom dinonaktifkan otomatis untuk elemen video.
              </p>
            </div>

            <div 
              className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 flex items-center justify-center cursor-pointer group shadow-xs hover:border-pink-300 dark:hover:border-pink-800 transition-colors"
              onClick={() => setVideoOpen(true)}
            >
              {/* Fake Video Thumbnail / Background styling */}
              <div className="absolute inset-0 bg-linear-to-tr from-slate-900/90 to-slate-900/40 z-10" />
              <img 
                src="https://lookaside.facebook.com/assets/astryx/Neutral-Backpack.png" 
                alt="Video poster" 
                className="absolute inset-0 w-full h-full object-cover opacity-40 blur-[2px]"
              />
              <div className="z-20 flex flex-col items-center gap-3 text-center p-4">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110">
                  <Play className="w-6 h-6 fill-current pl-1" />
                </div>
                <span className="text-white font-semibold text-sm">Play Video</span>
              </div>
            </div>

            <Lightbox 
              open={videoOpen}
              close={() => setVideoOpen(false)}
              slides={[
                {
                  type: "video",
                  src: "https://lookaside.facebook.com/assets/?set=astryx&name=Nature-1&density=1",
                  alt: "Flower blooming in time-lapse",
                  title: "Flower blooming in time-lapse"
                }
              ]}
            />
          </section>

          {/* 3. Lightbox — Zoom */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/30 text-pink-600">
                  <ZoomIn className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 font-heading">Lightbox — Zoom</h2>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Lightbox dengan fitur zoom dan pan aktif. Klik dua kali (double-click) pada gambar untuk memperbesar, lalu geser (drag) untuk menjelajahi piksel gambar.
              </p>
            </div>

            <div 
              className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 flex items-center justify-center cursor-pointer group shadow-xs"
              onClick={() => setZoomOpen(true)}
            >
              <img 
                src="https://lookaside.facebook.com/assets/astryx/light-scene-horizontal-1.png" 
                alt="Zoom image preview" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/45 transition-colors z-10" />
              <div className="z-20 flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 py-2.5 px-4 rounded-xl shadow-md backdrop-blur-xs text-xs font-semibold text-slate-800 dark:text-slate-200">
                <Move className="w-4 h-4 text-pink-600" />
                Zoom & Pan Aktif
              </div>
            </div>

            <Lightbox 
              open={zoomOpen}
              close={() => setZoomOpen(false)}
              hasZoom
              slides={[
                {
                  src: "https://lookaside.facebook.com/assets/astryx/light-scene-horizontal-1.png",
                  alt: "Coastal shoreline with ocean waves",
                  title: "Coastal shoreline with ocean waves"
                }
              ]}
            />
          </section>

        </div>

      </div>
    </main>
  )
}
