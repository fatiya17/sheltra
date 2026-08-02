"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { CalendarIcon, Clock, Send } from "lucide-react"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { TimePicker } from "@/components/ui/time-picker"
import { useToast } from "@/components/ui/toast"

import { LocationPicker } from "./location-picker"
import { EvidenceUpload } from "./evidence-upload"
import { REPORT_CATEGORIES } from "../constants/report.constants"
import { offlineReportService } from "../services/offline-report.service"

// helper format tanggal jam lokal
function getInitialDateTimeISO() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  const hh = String(d.getHours()).padStart(2, "0")
  const roundedMin = String(Math.floor(d.getMinutes() / 15) * 15).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}T${hh}:${roundedMin}`
}

// helper gabung tanggal dan jam
function formatDateTimeString(baseDate, timeString) {
  const yyyy = baseDate.getFullYear()
  const mm = String(baseDate.getMonth() + 1).padStart(2, "0")
  const dd = String(baseDate.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}T${timeString}`
}

const reportSchema = z.object({
  category: z
    .string({
      required_error: "Silakan pilih kategori insiden.",
    })
    .min(1, "Silakan pilih kategori insiden."),
  location: z
    .string({
      required_error: "Silakan isi lokasi kejadian.",
    })
    .min(1, "Silakan isi lokasi kejadian."),
  time: z.string().optional(),
  description: z.string().optional(),
})

export function ReportForm({ onSubmitSuccess, onOfflineSaved }) {
  const [evidence, setEvidence] = useState(null)
  const toast = useToast()

  const form = useForm({
    resolver: zodResolver(reportSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      category: "",
      location: "",
      time: getInitialDateTimeISO(),
      description: "",
    },
  })

  // handler submit form
  const onSubmit = async (values) => {
    const newReport = {
      id: `rep-${Date.now()}`,
      category: values.category,
      location: values.location,
      time: values.time || new Date().toISOString().slice(0, 16),
      description: values.description || "Tidak ada rincian tambahan.",
      status: "Laporan Baru (Anonim)",
      createdAt: "Baru saja",
      evidence: evidence ? { ...evidence } : null,
    }

    // cek status offline
    if (!offlineReportService.isOnline()) {
      await offlineReportService.savePendingReport(newReport)
      if (onOfflineSaved) {
        onOfflineSaved(newReport)
      }
      toast({
        title: "You are offline",
        body: "Laporan anda akan dikirim otomatis ketika online",
        type: "offline",
        bg: "#0A1317",
        duration: 5000,
      })
    } else {
      // kondisi online normal
      onSubmitSuccess(newReport)
    }

    form.reset({
      category: "",
      location: "",
      time: getInitialDateTimeISO(),
      description: "",
    })
    setEvidence(null)
  }

  return (
    <Card className="p-4 md:p-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold font-heading">
          Form Pelaporan Insiden Anonim
        </CardTitle>
        <CardDescription>
          Laporkan pengalaman atau potensi bahaya di ruang publik untuk membantu menjaga keamanan sesama pengguna.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* field kategori */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>
                    Kategori Insiden <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(val) => {
                        field.onChange(val)
                        if (val) form.clearErrors("category")
                      }}
                      value={field.value}
                    >
                      <SelectTrigger
                        id="category"
                        className="w-full focus:border-primary focus:ring-primary aria-invalid:focus:border-primary aria-invalid:focus:ring-primary"
                      >
                        <SelectValue placeholder="Pilih Kategori Insiden" />
                      </SelectTrigger>
                      <SelectContent className="bg-card">
                        {REPORT_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* field lokasi */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <LocationPicker
                    value={field.value}
                    onChange={(val) => {
                      field.onChange(val)
                      if (val && val.trim().length > 0) {
                        form.clearErrors("location")
                      }
                    }}
                    onAddressDetailsChange={null}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* field waktu kejadian */}
            <FormField
              control={form.control}
              name="time"
              render={({ field }) => {
                const dateVal = field.value ? new Date(field.value) : undefined

                const handleDateSelect = (selectedDate) => {
                  if (!selectedDate) return
                  const currentDate = dateVal || new Date()
                  const hh = dateVal ? String(currentDate.getHours()).padStart(2, "0") : "12"
                  const min = dateVal ? String(currentDate.getMinutes()).padStart(2, "0") : "00"
                  field.onChange(formatDateTimeString(selectedDate, `${hh}:${min}`))
                }

                const timeValue = dateVal
                  ? `${String(dateVal.getHours()).padStart(2, "0")}:${String(dateVal.getMinutes()).padStart(2, "0")}`
                  : ""

                return (
                  <FormItem className="space-y-2 flex flex-col">
                    <FormLabel>Waktu Kejadian</FormLabel>
                    <div className="flex gap-3 w-full flex-wrap sm:flex-nowrap">
                      {/* popover pemilih tanggal */}
                      <Popover>
                        <FormControl>
                          <PopoverTrigger
                            render={
                              <Button
                                variant="outline"
                                className={`flex-1 justify-start text-left font-normal focus:border-primary focus:ring-primary ${!field.value ? "text-muted-foreground" : ""}`}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateVal ? (
                                  format(dateVal, "EEEE, dd MMMM yyyy", { locale: id })
                                ) : (
                                  <span>Pilih Tanggal</span>
                                )}
                              </Button>
                            }
                          />
                        </FormControl>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={dateVal}
                            onSelect={handleDateSelect}
                            initialFocus
                            captionLayout="dropdown"
                            startMonth={new Date(2000, 0)}
                            endMonth={new Date()}
                          />
                        </PopoverContent>
                      </Popover>

                      {/* time picker 2 kolom jam dan menit */}
                      <div className="w-full sm:w-36">
                        <FormControl>
                          <TimePicker
                            value={timeValue}
                            onChange={(val) => {
                              const d = dateVal || new Date()
                              field.onChange(formatDateTimeString(d, val))
                            }}
                          />
                        </FormControl>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />

            {/* field deskripsi */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Rincian Laporan (Opsional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Jelaskan kronologi singkat atau ciri-ciri kondisi area secara jelas..."
                      className="focus:border-primary focus:ring-primary aria-invalid:focus:border-primary aria-invalid:focus:ring-primary"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* upload bukti */}
            <EvidenceUpload evidence={evidence} onEvidenceChange={setEvidence} />

            {/* tombol submit */}
            <div className="pt-2 flex items-center justify-end">
              <Button type="submit" variant="pill" size="pill" className="flex items-center gap-2">
                <Send className="w-4 h-4" /> Kirim Laporan Anonim
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
