import React from "react";
import prisma from "@/lib/prisma";

export default async function GlobalLoading() {
  // Tarik data branding agar logo di loading screen sinkron dengan admin
  const setting = await prisma.setting.findFirst();
  const siteName = setting?.siteName || "VisionStream";
  const logoUrl = setting?.logoUrl;

  return (
    <div className="fixed inset-0 z-[100] flex min-h-screen w-screen flex-col items-center justify-center bg-background backdrop-blur-md">
      
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-30">
        <div className="h-64 w-64 rounded-full bg-accent/20 blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 animate-in fade-in duration-500">
        
        {/* BRANDING DINAMIS: Jika ada Logo URL tampilkan Gambar, jika tidak tampilkan Teks Animasi */}
        {logoUrl ? (
          <img 
            src={logoUrl} 
            alt={siteName} 
            className="h-14 object-contain animate-pulse drop-shadow-[0_0_20px_rgba(229,9,20,0.4)]" 
          />
        ) : (
          <div className="text-4xl font-black tracking-tighter text-accent uppercase italic drop-shadow-[0_0_20px_rgba(229,9,20,0.6)] animate-pulse">
            {siteName.split(' ')[0]}<span className="text-white">{siteName.split(' ')[1] || ""}</span>
          </div>
        )}
        
        <div className="relative flex h-14 w-14 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-20"></span>
          <span className="inline-flex h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-accent shadow-[0_0_15px_rgba(229,9,20,0.5)]"></span>
        </div>
        
        <p className="text-[11px] font-bold tracking-[0.3em] text-muted uppercase animate-pulse">
          Sinkronisasi {siteName}...
        </p>
      </div>
    </div>
  );
}