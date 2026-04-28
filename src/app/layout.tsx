import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MobileNav from "@/components/MobileNav";
import { headers, cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { ShieldAlert } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0A0A0B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

// 1. GENERATOR SEO DINAMIS (Pusat Branding di Browser Tab)
export async function generateMetadata(): Promise<Metadata> {
  const setting = await prisma.setting.findFirst();
  const siteTitle = setting?.siteName || "Live Stream";
  
  return {
    title: {
      default: `${siteTitle} | TV & Radio Online Portal`,
      template: `%s | ${siteTitle}`
    },
    description: setting?.seoDescription || "Platform penyiaran digital eksklusif.",
    manifest: "/manifest.json",
    icons: {
      icon: setting?.logoUrl || "/favicon.ico",
    }
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  // 2. AMBIL PENGATURAN BRANDING & MAINTENANCE
  const setting = await prisma.setting.findFirst();
  const siteName = setting?.siteName || "Live Stream";
  const logoUrl = setting?.logoUrl;
  const isMaintenance = setting?.isMaintenance || false;

  const showMaintenance = isMaintenance && !token && !pathname.startsWith('/login');

  if (showMaintenance) {
    return (
      <html lang="id" className="dark">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-accent selection:text-white overscroll-none`}>
          <div className="relative flex min-h-screen items-center justify-center bg-background text-white overflow-hidden">
            <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
              <div className="h-[70vw] w-[70vw] max-h-[800px] max-w-[800px] rounded-full bg-red-600/10 blur-[150px]" />
            </div>
            
            <div className="relative z-10 flex flex-col items-center text-center p-8 animate-in zoom-in-95 duration-700">
              <ShieldAlert size={80} className="text-red-500 mb-6 animate-pulse" />
              
              {/* BRANDING DINAMIS: Gunakan Logo Gambar jika tersedia, jika tidak gunakan Teks */}
              {logoUrl ? (
                <img src={logoUrl} alt={siteName} className="h-16 mb-4 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
              ) : (
                <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter text-white mb-4 drop-shadow-2xl uppercase">
                  {siteName.split(' ')[0]}<span className="text-accent">{siteName.split(' ').slice(1).join(' ')}</span>
                </h1>
              )}
              
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-6 py-2 rounded-full text-xs font-bold tracking-widest uppercase mb-6 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                Sistem Dalam Perbaikan
              </div>
              
              <p className="text-muted max-w-md mx-auto text-sm md:text-base leading-relaxed">
                Kami sedang melakukan pemeliharaan rutin pada server {siteName} untuk meningkatkan kualitas layanan.
              </p>
            </div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="id" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-accent selection:text-white overscroll-none`}>
        <div className="flex flex-col min-h-screen">
          <div className="flex-grow pb-24 md:pb-0">
            {children}
          </div>
          <MobileNav />
        </div>
      </body>
    </html>
  );
}