import React from "react";
import Navbar from "@/components/Navbar";
import prisma from "@/lib/prisma";
import { HelpCircle, LifeBuoy } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HelpPage() {
  const settings = await prisma.setting.findFirst();

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-accent selection:text-white">
      <Navbar />

      <main className="flex-grow pt-32 pb-20 relative">
        {/* Aesthetic Background Effect */}
        <div className="absolute top-[-100px] right-0 w-[500px] h-[500px] bg-accent/5 blur-[120px] pointer-events-none rounded-full" />
        
        <div className="container mx-auto max-w-4xl px-6 relative z-10">
          
          {/* Header Section */}
          <div className="mb-20 text-center md:text-left animate-in fade-in slide-in-from-left-6 duration-1000">
            <div className="flex items-center justify-center md:justify-start gap-4 mb-8">
              <div className="p-4 bg-accent/10 rounded-2xl border border-accent/20">
                <LifeBuoy size={32} className="text-accent" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.5em] text-accent">Support Center</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter uppercase italic">
              PUSAT <br/>
              <span className="text-transparent" style={{ WebkitTextStroke: '1.2px rgba(255,255,255,0.5)' }}>BANTUAN</span>
            </h1>
          </div>

          {/* Main Support Content Area */}
          <div className="relative">
             <div className="relative rounded-[2.5rem] border border-white/5 bg-surface/40 p-8 md:p-14 lg:p-20 backdrop-blur-md shadow-2xl overflow-hidden">
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   <HelpCircle size={200} />
                </div>

                {settings?.helpContent ? (
                  <article 
                    className="rich-text relative z-10"
                    dangerouslySetInnerHTML={{ __html: settings.helpContent }} 
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-center opacity-30">
                    <HelpCircle size={64} className="mb-6 text-muted" />
                    <p className="text-lg font-bold uppercase tracking-widest text-muted italic">Panduan bantuan sedang dalam tahap penyusunan.</p>
                  </div>
                )}
             </div>
          </div>

          {/* Footnote Tambahan */}
          <p className="mt-12 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted/20 leading-relaxed max-w-xl mx-auto">
            Gunakan panduan di atas untuk menyelesaikan kendala teknis Anda. Konten diperbarui secara berkala oleh tim operasional VisionStream.
          </p>
        </div>
      </main>

      <footer className="border-t border-white/5 bg-black py-12">
        <div className="container mx-auto px-6 text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-muted/10">
            VisionStream Customer Success &bull; Protocol 2026
          </p>
        </div>
      </footer>
    </div>
  );
}