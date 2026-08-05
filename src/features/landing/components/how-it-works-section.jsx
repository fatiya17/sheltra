import Image from "next/image";
import { ScanSearch, Route, Siren, BadgeCheck } from "lucide-react";

const steps = [
  {
    number: "1",
    title: "Cari",
    description: "Cari tujuan atau rencanakan perjalananmu.",
    icon: ScanSearch,
  },
  {
    number: "2",
    title: "Cek",
    description: "Temukan rute teraman berdasarkan tingkat risiko dan titik aman.",
    icon: Route,
  },
  {
    number: "3",
    title: "SOS",
    description: "Gunakan SOS atau Guardian jika membutuhkan bantuan.",
    icon: Siren,
  },
  {
    number: "4",
    title: "Tiba dengan Aman",
    description: "Sampai di tujuan dengan lebih aman dan percaya diri.",
    icon: BadgeCheck,
  },
];

export function HowItWorksSection() {
  return (
    <section className="w-full py-12 md:py-20 bg-white">
      <div className="container px-4 md:px-10 lg:px-16 mx-auto space-y-8">

        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Cara Kerja Sheltra
        </h2>

        {/* selalu 4 kolom, ukuran menyesuaikan */}
        <div className="grid grid-cols-4 gap-2 sm:gap-6">
          {steps.map((step, idx) => (
            <div key={idx} className="flex flex-col items-center text-center space-y-2 sm:space-y-3">
              <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
                <step.icon className="w-6 h-6 sm:w-9 sm:h-9 md:w-10 md:h-10" strokeWidth={2} />
              </div>
              <div className="space-y-0.5 sm:space-y-1">
                <h3 className="text-xs sm:text-sm md:text-base font-bold text-slate-900">
                  {step.number}. {step.title}
                </h3>
                <p className="text-slate-600 text-[10px] sm:text-xs md:text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* preview app */}
        <div className="w-full mt-4">
          <Image
            src="/assets/preview-app.svg"
            alt="Preview aplikasi Sheltra"
            width={1200}
            height={600}
            className="w-full h-auto object-contain"
            priority
          />
        </div>

      </div>
    </section>
  );
}