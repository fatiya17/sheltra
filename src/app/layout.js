import { Geist, Geist_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/features/auth/context/auth-context";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import "./globals.css";
import "mapbox-gl/dist/mapbox-gl.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Sheltra - Keselamatan Publik Interaktif",
  description: "Platform peta keselamatan publik dan rute aman interaktif",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <AuthProvider>
          <ToastProvider>
            <TooltipProvider>
              {children}
              <MobileBottomNav />
            </TooltipProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}