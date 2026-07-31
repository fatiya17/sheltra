import Link from "next/link";
import AnonymousReport from "@/features/report/components/anonymous-report";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-background md:py-10 flex flex-col items-center justify-start gap-8">
      
      {/* Global Showcase Header Navigation */}
      <div className="w-full max-w-6xl px-4 md:px-6">
        <div className="w-full p-4 rounded-3xl bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-primary/20 text-primary-foreground">
              <Sparkles className="w-4 h-4 text-pink-600 dark:text-pink-400" />
            </div>
            <span className="font-bold text-sm text-slate-800 dark:text-white">
              SISTECH 2026 Showcase
            </span>
          </div>
          
          <div className="flex gap-2 flex-wrap justify-center">
            <Link href="/button-showcase">
              <Button variant="outline" size="xs">Button</Button>
            </Link>
            <Link href="/badge-showcase">
              <Button variant="outline" size="xs">Badge</Button>
            </Link>
            <Link href="/form-showcase">
              <Button variant="outline" size="xs">Form</Button>
            </Link>
            <Link href="/lightbox-showcase">
              <Button variant="outline" size="xs">Lightbox</Button>
            </Link>
            <Link href="/map-showcase">
              <Button variant="outline" size="xs">Map</Button>
            </Link>
          </div>
        </div>
      </div>

      <AnonymousReport />
    </main>
  );
}
