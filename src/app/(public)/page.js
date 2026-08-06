import React from "react"
import { Navbar } from "@/features/landing/components/navbar"
import { HeroSection } from "@/features/landing/components/hero-section"
import { FeaturesSection } from "@/features/landing/components/features-section"
import { HowItWorksSection } from "@/features/landing/components/how-it-works-section"
import { AboutSection } from "@/features/landing/components/about-section"
import { FooterSection } from "@/features/landing/components/footer-section"

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen w-full bg-background flex flex-col items-center justify-start">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <AboutSection />
        <FooterSection />
      </main>
    </>
  )
}