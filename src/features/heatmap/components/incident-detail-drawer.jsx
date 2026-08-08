"use client";

import React from "react";
import { X, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const getRiskData = (score) => {
  if (score >= 75) {
    return {
      label: "Risiko Tinggi",
      text: "text-red-500",
      dot: "bg-red-500",
      variant: "destructive",
    };
  }

  if (score >= 40) {
    return {
      label: "Risiko Sedang",
      text: "text-amber-500",
      dot: "bg-amber-500",
      variant: "warning",
    };
  }

  return {
    label: "Risiko Rendah",
    text: "text-green-500",
    dot: "bg-green-500",
    variant: "success",
  };
};

export function IncidentDetailDrawer({
  incident,
  isOpen,
  onClose,
  onOpenReport,
}) {
  if (!isOpen || !incident) return null;

  const riskScore = incident.riskScore ?? 85;
  const risk = getRiskData(riskScore);
  const reports = incident.totalReports ?? 12;
  const location = incident.location || "Jl. Margonda Raya Dekat Kober";
  const dangerousTime = incident.timeOfDay || "18.00 - 22.00";
  const nearestSafePoint = incident.safePoint || "Pos Polisi Margonda";
  const nearestDistance = incident.safeDistance || "450 m";

  const incidentTypes = incident.incidentTypes || [
    { name: "Catcalling", total: 7, color: "#ec4899" },
    { name: "Dikuntit", total: 3, color: "#f59e0b" },
    { name: "Kontak Fisik", total: 2, color: "#7c3aed" },
  ];

  const maxValue = Math.max(...incidentTypes.map((i) => i.total));

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex justify-center items-end sm:items-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-t-[24px] sm:rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 duration-300 flex flex-col max-h-[90vh]"
      >
        {/* Mobile Handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex justify-between items-center px-5 py-3.5 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              Detail Area & Risiko
            </h2>
            <p className="text-[11px] text-gray-400">
              Analisis historis laporan masyarakat
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-gray-50 hover:bg-gray-100 transition flex items-center justify-center text-gray-500"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* TOP SECTION */}
          <div className="space-y-2">
            <div className="font-semibold text-sm text-gray-900">
              {location}
            </div>

            {/* Risiko kiri - Badge kanan */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className={`w-2.5 h-2.5 rounded-full ${risk.dot}`} />
                <span className={risk.text}>{risk.label}</span>
              </div>

              <Badge
                variant={risk.variant}
                className="font-semibold px-2.5 py-0.5 text-xs shrink-0"
              >
                Skor Risiko: {riskScore}/100
              </Badge>
            </div>

            {/* Laporan */}
            <div className="text-xs text-gray-500">
              {reports} Laporan (7 hari terakhir)
            </div>
          </div>

          <hr className="border-gray-100 my-4" />

          {/* JENIS KEJADIAN */}
          <section>
            <h3 className="text-xs font-bold text-gray-800 mb-3">
              Jenis Kejadian
            </h3>

            <div className="space-y-2.5">
              {incidentTypes.map((item) => {
                const width = (item.total / maxValue) * 100;

                return (
                  <div
                    key={item.name}
                    className="grid grid-cols-[110px_1fr_25px] items-center gap-3 text-xs"
                  >
                    <span className="text-gray-600 font-medium">
                      {item.name}
                    </span>

                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${width}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>

                    <span className="text-gray-600 font-semibold text-right">
                      {item.total}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <hr className="border-gray-100 my-4" />

          {/* JAM RAWAN */}
          <section className="flex justify-between items-center text-xs">
            <span className="font-bold text-gray-700">Jam Rawan</span>
            <span className="font-semibold text-gray-900">{dangerousTime}</span>
          </section>

          <hr className="border-gray-100 my-4" />

          {/* TITIK AMAN TERDEKAT */}
          <section className="space-y-2 text-xs">
            <h3 className="font-bold text-gray-700">Titik Aman Terdekat</h3>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-semibold text-gray-800">
                  {nearestSafePoint}
                </span>
              </div>

              <span className="font-bold text-emerald-600">
                {nearestDistance}
              </span>
            </div>
          </section>
        </div>

        {/* FOOTER */}
        <div className="border-t border-gray-100 bg-gray-50/50 px-5 pt-3 pb-8 sm:py-3">
          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-white font-bold text-gray-700 hover:bg-gray-50 text-xs transition"
            >
              Tutup
            </button>

            <button
              onClick={() => {
                onClose();
                if (onOpenReport) {
                  onOpenReport();
                }
              }}
              className="flex-1 py-2.5 rounded-xl bg-[#e8195a] text-white font-bold hover:bg-[#cf0f4f] text-xs transition shadow-sm"
            >
              Lapor Insiden
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
