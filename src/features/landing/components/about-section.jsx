import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function AboutSection() {
  return (
    <section className="w-full py-8 md:py-20 bg-rose-600 text-white overflow-hidden">
      <div className="container px-4 md:px-10 lg:px-16 mx-auto">
        <div className="grid gap-4 sm:gap-10 grid-cols-2 items-center">

          {/* kolom kiri: teks */}
          <div className="space-y-3 sm:space-y-5">
            <h2 className="text-lg sm:text-3xl md:text-4xl font-bold tracking-tight">
              Tentang Sheltra
            </h2>

            <p className="text-rose-50 text-[10px] sm:text-base md:text-lg leading-relaxed max-w-xl">
              Sheltra adalah platform keselamatan perempuan yang membantu Anda bepergian dengan lebih aman melalui rekomendasi rute, pelaporan anonim, dan fitur darurat yang responsif.
            </p>

            <Link href="/about">
              <Button
                size="lg"
                className="rounded-full bg-white text-rose-600 hover:bg-rose-50 font-semibold px-6 sm:px-10 py-2 sm:py-3 shadow-md text-xs sm:text-base h-auto"
              >
                Selengkapnya
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </Button>
            </Link>
          </div>

          {/* kolom kanan: gambar safe route */}
          <div className="relative mx-auto w-full max-w-[280px] sm:max-w-[360px] md:max-w-[420px]">
            <div className="relative w-full rounded-2xl overflow-hidden">
              <Image
                src="/assets/safe route.png"
                alt="Ilustrasi Safe Route Sheltra"
                width={420}
                height={420}
                className="w-full h-auto object-contain"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
