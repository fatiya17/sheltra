import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const features = [
  {
    title: "Safe Route Recommendation",
    description: "Temukan rute paling aman dengan estimasi risiko & waktu tiba.",
    image: "/assets/safe-route-recommendation.svg",
    cta: "Temukan Rute Ter-aman",
    link: "/safe-route",
  },
  {
    title: "Anonymous Reporting",
    description: "Laporkan kejadian dengan aman dan anonim.",
    image: "/assets/anonymous-reporting.svg",
    cta: "Laporkan Insiden",
    link: "/anonymous-report",
  },
  {
    title: "Emergency SOS",
    description: "Tekan & tahan 2 detik untuk memberi tahu kontak terpercaya.",
    image: "/assets/sos.png",
    cta: "Darurat",
    link: "/sos",
  },
  {
    title: "Interactive Map",
    description: "Cek area sekitar, lihat titik rawan, dan temukan tempat aman dengan mudah.",
    image: "/assets/interactive-map.svg",
    cta: "Lihat Map",
    link: "/heatmap",
  },
];

export function FeaturesSection() {
  return (
    <section className="w-full py-16 md:py-24 bg-white">
      <div className="container px-4 md:px-10 lg:px-16 mx-auto space-y-8">

        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Fitur Utama
        </h2>

        {/* grid 1 kolom di mobile, 2 kolom di sm ke atas */}
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2">
          {features.map((item, idx) => (
            <Card
              key={idx}
              className="border-none bg-white shadow-[0_0_4px_rgba(0,0,0,0.25)] hover:shadow-[0_0_8px_rgba(0,0,0,0.25)] transition-all duration-300 rounded-2xl overflow-hidden ring-0"
            >
              {/* flex-row: gambar kiri, teks kanan */}
              <CardContent className="flex flex-row items-center gap-2.5 sm:gap-3 p-2">

                {/* kolom kiri: gambar asset */}
                <div className="w-25 h-25 sm:w-30 sm:h-30 shrink-0 flex items-center justify-center">
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={180}
                    height={180}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* kolom kanan: teks, deskripsi, & button */}
                <div className="flex-1 space-y-1 sm:space-y-1.5 min-w-0">
                  <h3 className="text-xs sm:text-sm md:text-base font-bold text-slate-900 leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                  <div>
                    <Link href={item.link}>
                      <Button
                        size="sm"
                        className="bg-rose-600 hover:bg-rose-700 text-white rounded-md mt-1 text-xs sm:text-sm h-7 sm:h-8 px-2.5 sm:px-3"
                      >
                        {item.cta}
                      </Button>
                    </Link>
                  </div>
                </div>

              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </section>
  );
}