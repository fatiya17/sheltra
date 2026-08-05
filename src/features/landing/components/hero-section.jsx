import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Search } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative w-full py-6 md:py-14 lg:py-20 bg-white overflow-hidden">
      <div className="container px-4 md:px-10 lg:px-16 mx-auto">
        <div className="grid gap-4 sm:gap-8 grid-cols-2 items-center">

          {/* kolom kiri: copywriting */}
          <div className="flex flex-col justify-center space-y-2 sm:space-y-3">
            <h1 className="text-xl sm:text-4xl md:text-5xl xl:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
              Keamanan Anda,<br />Prioritas Kami
            </h1>
            <p className="max-w-[480px] text-slate-500 text-xs sm:text-base md:text-lg leading-relaxed">
              Temukan rute yang lebih aman dan berpergian dengan tenang
            </p>

            {/* search bar & badge - hidden di mobile, tampil di sm ke atas */}
            <div className="hidden sm:block space-y-4 pt-2">
              <form className="relative w-full max-w-lg">
                <div className="flex items-center w-full rounded-full border-2 border-rose-500 bg-white pr-1.5 py-1.5 pl-5 shadow-sm focus-within:ring-2 focus-within:ring-rose-200 transition-shadow">
                  <Input
                    type="text"
                    placeholder="Mau pergi kemana?"
                    className="border-0 shadow-none focus-visible:ring-0 px-0 h-9 text-base placeholder:text-slate-400 bg-transparent"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="rounded-full bg-rose-600 hover:bg-rose-700 text-white w-11 h-11 shrink-0"
                  >
                    <Search className="w-5 h-5" />
                  </Button>
                </div>
              </form>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="px-3 py-1 bg-rose-50 border-rose-200 text-rose-600 rounded-full text-sm">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-rose-500" />
                  100% Anonim & Aman
                </Badge>
              </div>
            </div>
          </div>

          {/* kolom kanan: gambar hero */}
          <div className="relative mx-auto w-full max-w-[280px] sm:max-w-[360px] md:max-w-[420px]">
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
          <div className="col-span-2 sm:hidden space-y-2">
            <form className="relative w-full">
              <div className="flex items-center w-full rounded-full border-2 border-rose-500 bg-white pr-1 py-1 pl-3 shadow-sm focus-within:ring-2 focus-within:ring-rose-200 transition-shadow">
                <Input
                  type="text"
                  placeholder="Mau pergi kemana?"
                  className="border-0 shadow-none focus-visible:ring-0 px-0 h-7 text-xs placeholder:text-slate-400 bg-transparent"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="rounded-full bg-rose-600 hover:bg-rose-700 text-white w-8 h-8 shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                </Button>
              </div>
            </form>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="px-2 py-0.5 bg-rose-50 border-rose-200 text-rose-600 rounded-full text-[10px]">
                <ShieldCheck className="w-3 h-3 mr-1 text-rose-500" />
                100% Anonim & Aman
              </Badge>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

