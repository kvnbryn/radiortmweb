import React from "react";
import Navbar from "@/components/Navbar";
import prisma from "@/lib/prisma";
import { ScrollText, Calendar, ShieldCheck } from "lucide-react";

// Pastikan data selalu fresh dari database
export const dynamic = "force-dynamic";

export default async function TermsPage() {
  const settings = await prisma.setting.findFirst();

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-accent selection:text-white">
      <Navbar />

      <main className="flex-grow pt-32 pb-20 relative">
        {/* Cinematic Backdrop Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-accent/5 blur-[150px] pointer-events-none rounded-full" />
        
        <div className="container mx-auto max-w-4xl px-6 relative z-10">
          
          {/* Header Section */}
          <div className="mb-20 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-[1px] w-12 bg-accent" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">User Agreement</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-white leading-none tracking-tighter uppercase italic">
              SYARAT & <br/>
              <span className="text-transparent" style={{ WebkitTextStroke: '1.1px rgba(255,255,255,0.4)' }}>KETENTUAN</span>
            </h1>

            <div className="mt-10 flex flex-wrap gap-6 items-center border-y border-white/5 py-6">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-accent" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                  Revisi: {settings?.updatedAt ? new Date(settings.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : "2026"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-accent" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Verified Protocol</span>
              </div>
            </div>
          </div>

          {/* Glassmorphism Content Card */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-b from-accent/10 to-transparent rounded-[2.5rem] blur-2xl opacity-20 transition duration-1000 group-hover:opacity-30" />
            
            <div className="relative rounded-[2.5rem] border border-white/10 bg-surface/60 p-8 md:p-14 lg:p-20 backdrop-blur-2xl shadow-2xl">
              {settings?.termsContent ? (
                <article 
                  className="rich-text"
                  dangerouslySetInnerHTML={{ __html: settings.termsContent }} 
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-20">
                  <ScrollText size={64} className="mb-6 text-muted" />
                  <p className="text-sm font-bold uppercase tracking-widest text-muted italic">
                    Dokumen syarat layanan belum diterbitkan.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footnote */}
          <p className="mt-12 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted/20 leading-relaxed max-w-xl mx-auto">
            Platform VisionStream berhak memperbarui dokumen ini sewaktu-waktu tanpa pemberitahuan sebelumnya demi keamanan pengguna.
          </p>
        </div>
      </main>

      <footer className="border-t border-white/5 bg-black py-12">
        <div className="container mx-auto px-6 text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-muted/10">
            &copy; 2026 VisionStream &bull; Legal Affairs Division
          </p>
        </div>
      </footer>
    </div>
  );
}