import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Search } from "lucide-react";

export function HeroSection() {
  return (
    <section id="hero" className="relative w-full py-6 md:py-14 lg:py-20 bg-white overflow-hidden">
      <div className="container px-4 md:px-10 lg:px-16 mx-auto">
        <div className="grid gap-4 sm:gap-8 grid-cols-5 md:grid-cols-12 items-center">

          {/* kolom kiri: copywriting */}
          <div className="flex flex-col justify-center space-y-2 sm:space-y-3 col-start-1 col-end-6 sm:col-end-4 md:col-end-8 row-start-1 relative z-10">
            <h1 className="text-2xl sm:text-4xl md:text-5xl xl:text-6xl font-semibold tracking-tight text-slate-900 leading-[1.1]">
              Keamanan Anda,<br />Prioritas Kami
            </h1>
            <p className="max-w-[400px] sm:max-w-[712px] text-black text-sm sm:text-lg md:text-xl leading-relaxed mt-2 sm:mt-4">
              Temukan rute yang lebih aman dan <br className="block sm:hidden" /> berpergian dengan tenang
            </p>

            {/* search bar & badge - hidden di mobile, tampil di sm ke atas */}
            <div className="hidden sm:block space-y-4 pt-2">
              <form className="relative w-full max-w-lg">
                <div className="flex items-center w-full rounded-full border-2 border-primary bg-white pr-4 py-1.5 pl-5 shadow-sm transition-shadow">
                  <Input
                    type="text"
                    placeholder="Mau pergi kemana?"
                    className="border-0 shadow-none focus-visible:ring-0 px-0 h-9 text-base placeholder:text-slate-400 bg-transparent flex-1"
                  />
                  <Search className="w-5 h-5 text-primary shrink-0" />
                </div>
              </form>

            </div>
          </div>

          {/* kolom kanan: gambar hero */}
          <div className="relative w-full max-w-[172px] sm:max-w-[240px] md:max-w-[420px] col-start-3 col-end-6 sm:col-start-4 sm:col-end-6 md:col-start-8 md:col-end-13 row-start-1 ml-auto">
            <Image
              src="/assets/hero.png"
              alt="Sheltra Hero"
              width={420}
              height={420}
              className="w-full h-auto object-contain"
              priority
            />
          </div>

          {/* search bar full width - hanya tampil di mobile */}
          <div className="col-start-1 col-end-6 sm:hidden space-y-2 mt-4">
            <form className="flex items-center w-full rounded-full border-2 border-primary bg-white pr-3 py-1 pl-3 shadow-sm transition-shadow">
              <Input
                type="text"
                placeholder="Mau pergi kemana?"
                className="border-0 shadow-none focus-visible:ring-0 px-0 h-9 w-full bg-transparent text-sm flex-1"
              />
              <Search className="w-4 h-4 text-primary shrink-0" />
            </form>
          </div>

        </div>
      </div>
    </section>
  );
}

