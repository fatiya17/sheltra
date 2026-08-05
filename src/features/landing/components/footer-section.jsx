import Link from "next/link";
import { Phone, Mail } from "lucide-react";

export function FooterSection() {
  return (
    <footer className="w-full bg-white pt-10 md:pt-10 pb-6 md:pb-10 mt-auto">
      <div className="container mx-auto px-6 md:px-10 lg:px-16 w-full">
        {/* UBAH DI SINI: Mobile 1 kolom, Tablet/Desktop baru 12 kolom */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-6 md:mb-8">

          {/* kolom kiri: brand & social */}
          {/* Tambahkan md:col-span-5 agar di desktop ambil 5 kolom */}
          <div className="md:col-span-5 flex flex-col items-start">
            <h2 className="text-2xl sm:text-3xl md:text-5xl leading-[1.1] text-rose-600 mb-2 sm:mb-4 tracking-tight font-extrabold">
              Sheltra
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6 max-w-xs">
              Rencanakan perjalanan lebih aman, laporkan insiden, dan dapatkan bantuan saat dibutuhkan.
            </p>

            <p className="text-slate-900 text-xs sm:text-sm font-semibold mb-2 sm:mb-3">Social Media</p>
            <div className="flex items-center gap-2 sm:gap-3">
              {/* facebook */}
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="p-2 -ml-2 rounded-full hover:bg-rose-50 hover:text-rose-600 hover:-translate-y-1 transition-all text-slate-600" aria-label="Facebook">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
              </a>
              {/* instagram */}
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-rose-50 hover:text-rose-600 hover:-translate-y-1 transition-all text-slate-600" aria-label="Instagram">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              {/* whatsapp */}
              <a href="https://wa.me/6281238789908" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-rose-50 hover:text-rose-600 hover:-translate-y-1 transition-all text-slate-600" aria-label="WhatsApp">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
            </div>
          </div>

          {/* kolom tengah: fitur */}
          <div className="md:col-span-4 flex flex-col gap-4 sm:gap-8 text-slate-600 text-xs sm:text-sm md:pt-4">
            <div className="flex flex-col gap-2">
              <h3 className="font-semibold text-slate-900 text-sm mb-1 sm:mb-2">Fitur</h3>
              <Link href="/safe-route" className="hover:text-rose-600 transition-colors">
                Safe Route Recommendation
              </Link>
              <Link href="/anonymous-report" className="hover:text-rose-600 transition-colors">
                Anonymous Reporting
              </Link>
              <Link href="/sos" className="hover:text-rose-600 transition-colors">
                Emergency SOS
              </Link>
            </div>
          </div>

          {/* kolom kanan: hubungi kami */}
          <div className="md:col-span-3 flex flex-col gap-3 sm:gap-4 text-slate-900 md:pt-4">
            <h3 className="font-semibold text-sm mb-0.5 sm:mb-2">Hubungi Kami</h3>

            <div className="flex items-center gap-2.5 text-slate-600 text-xs sm:text-sm">
              <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <span>(+62) 812-3878-9908</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-600 text-xs sm:text-sm">
              <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <span>sheltra@gmail.com</span>
            </div>
          </div>

        </div>

        {/* bottom section */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-6 sm:pt-8 border-t border-slate-200 border-dashed gap-4 sm:gap-4">
          <p className="text-slate-400 text-xs font-medium text-center sm:text-left">
            © 2026 Group 1 SISTECH. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
            <span>designed for</span>
            <span className="text-slate-900 font-semibold hover:text-rose-600 transition-colors cursor-pointer">SISTECH 2026</span>
          </div>
        </div>
      </div>
    </footer>
  );
}