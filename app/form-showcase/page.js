"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { 
  Check, 
  ChevronDown, 
  ArrowLeft, 
  ArrowUpRight, 
  Sparkles,
  CheckCircle2
} from "lucide-react"

export default function FormShowcase() {
  const [selectedJobTypes, setSelectedJobTypes] = useState(["Full-time"])
  const [salaryRange, setSalaryRange] = useState("$80—100k/year")
  const [roleText, setRoleText] = useState("")
  const [roleError, setRoleError] = useState(null)
  const [bioText, setBioText] = useState("")

  const jobTypeOptions = [
    "Full-time",
    "Part-time",
    "Freelance / contract",
    "Internship"
  ]

  const salaryOptions = [
    "$40—60k/year",
    "$60—80k/year",
    "$80—100k/year",
    "$100—120k/year",
    "$120k+/year"
  ]

  const toggleJobType = (type) => {
    if (selectedJobTypes.includes(type)) {
      setSelectedJobTypes(selectedJobTypes.filter((t) => t !== type))
    } else {
      setSelectedJobTypes([...selectedJobTypes, type])
    }
  }

  const handleNext = () => {
    if (!roleText.trim()) {
      setRoleError("This field is required!")
      return
    }
    setRoleError(null)
    console.log({
      selectedJobTypes,
      salaryRange,
      roleText,
      bioText
    })
  }

  return (
    <main className="min-h-screen w-full bg-slate-100 dark:bg-slate-950 py-12 px-4 md:px-8 flex flex-col items-center justify-between font-sans">
      
      {/* Header Navigation */}
      <div className="w-full max-w-2xl mb-8 text-center relative p-6 rounded-3xl bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-xs">
        <div className="absolute top-4 left-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              Beranda
            </Button>
          </Link>
        </div>
        <div className="inline-flex p-2 rounded-2xl bg-primary/20 text-primary-foreground mb-3">
          <Sparkles className="w-5 h-5 text-pink-600 dark:text-pink-400 animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
          Radix UI & Shadcn Form Showcase
        </h1>
        <div className="mt-4 flex justify-center gap-2 flex-wrap">
          <Link href="/button-showcase">
            <Button variant="outline" size="xs">Button</Button>
          </Link>
          <Link href="/badge-showcase">
            <Button variant="outline" size="xs">Badge</Button>
          </Link>
          <Link href="/lightbox-showcase">
            <Button variant="outline" size="xs">Lightbox</Button>
          </Link>
          <Link href="/map-showcase">
            <Button variant="outline" size="xs">Map</Button>
          </Link>
        </div>
      </div>

      {/* Main Interactive Form Card Mockup */}
      <div className="w-full max-w-[540px] bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200/60 dark:border-slate-850 p-8 md:p-10 shadow-xs relative">
        
        {/* Form Content */}
        <div className="space-y-6">
            
            {/* Step Progress Header */}
            <div className="space-y-3">
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Step 2/4
              </span>
              <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="w-[50%] h-full bg-primary rounded-full" />
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                What role do you want to find?
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed font-normal">
                Tell us what kind of job you're targeting so we can tailor your search and recommendations
              </p>
            </div>

            {/* 1. Job Type selection pills */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-950 dark:text-slate-100">
                Job type:
              </label>
              <div className="flex flex-wrap gap-2">
                {jobTypeOptions.map((type) => {
                  const isActive = selectedJobTypes.includes(type)
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleJobType(type)}
                      className={`inline-flex items-center gap-1.5 py-2.5 px-4 rounded-full border text-xs font-normal transition-all duration-200 cursor-pointer select-none ${
                        isActive
                          ? "border-slate-300 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-850 dark:text-white"
                          : "border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400 hover:border-slate-350 dark:hover:border-slate-700"
                      }`}
                    >
                      {isActive && (
                        <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                      {type}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 2. Expected Salary Range (Dropdown Selector) */}
            <div className="space-y-2 relative">
              <label className="text-xs font-bold text-slate-950 dark:text-slate-100">
                Expected salary range:
              </label>
              
              <Select value={salaryRange} onValueChange={setSalaryRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih rentang gaji" />
                </SelectTrigger>
                <SelectContent>
                  {salaryOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 3. Your Role text field */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-950 dark:text-slate-100">
                Your role:
              </label>
              <Input
                type="text"
                placeholder="e.g. UI/UX designer"
                value={roleText}
                onChange={(e) => {
                  setRoleText(e.target.value)
                  if (e.target.value.trim() && roleError) {
                    setRoleError(null)
                  }
                }}
                aria-invalid={!!roleError}
              />
              {roleError && (
                <p className="text-[11px] text-red-500 dark:text-red-400 mt-1 animate-in fade-in slide-in-from-top-1 duration-150">
                  {roleError}
                </p>
              )}
            </div>

            {/* 4. Tell us about yourself (Textarea) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-950 dark:text-slate-100">
                Short bio:
              </label>
              <Textarea
                placeholder="Write a brief overview of your background..."
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
              />
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setRoleText("")
                  setSelectedJobTypes([])
                  setRoleError(null)
                  setBioText("")
                }}
                className="py-2.5 px-6 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-150 dark:hover:bg-slate-750 transition-colors cursor-pointer select-none"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="py-2.5 px-6 rounded-xl text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors cursor-pointer select-none"
              >
                Next
              </button>
            </div>

          </div>

        </div>

      {/* Footer Branding */}
      <span className="mt-8 text-[11px] font-semibold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
        LOSEVA.PRO
      </span>
      
    </main>
  )
}
