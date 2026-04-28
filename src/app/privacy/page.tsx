import React from "react";
import Navbar from "@/components/Navbar";
import prisma from "@/lib/prisma";
import { ShieldAlert, Calendar, Lock } from "lucide-react";

// Force Dynamic agar perubahan di Admin Panel langsung muncul tanpa nunggu 60 detik
export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  // Ambil data terbaru langsung dari database
  const settings = await prisma.setting.findFirst();

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-accent selection:text-white">
      <Navbar />

      <main className="flex-grow pt-32 pb-20 relative">
        {/* Dekorasi Background Minimalis (Bukan Grid AI) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-accent/10 blur-[120px] pointer-events-none rounded-full" />
        
        <div className="container mx-auto max-w-4xl px-6 relative z-10">
          
          {/* Header Sinematik */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-[1px] w-12 bg-accent" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">Legal Document</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-white leading-none tracking-tighter">
              PRIVASI <br/>
              <span className="text-transparent" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.4)' }}>PLATFORM</span>
            </h1>

            <div className="mt-10 flex flex-wrap gap-6 items-center border-y border-white/5 py-6">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-accent" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                  Update: {settings?.updatedAt ? new Date(settings.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : "2026"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Lock size={14} className="text-accent" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted text-nowrap">End-to-End Encryption</span>
              </div>
            </div>
          </div>

          {/* Content Card Premium */}
          <div className="relative group">
            {/* Glow effect on hover */}
            <div className="absolute -inset-1 bg-gradient-to-b from-accent/20 to-transparent rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000" />
            
            <div className="relative rounded-[2rem] border border-white/10 bg-surface/80 p-8 md:p-14 lg:p-20 backdrop-blur-xl shadow-2xl">
              {settings?.privacyContent ? (
                <article 
                  className="rich-text"
                  dangerouslySetInnerHTML={{ __html: settings.privacyContent }} 
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <ShieldAlert size={48} className="mb-6 text-muted/20" />
                  <p className="text-sm font-bold uppercase tracking-widest text-muted/40 italic">
                    Kebijakan belum diterbitkan oleh pihak otoritas.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Disclaimer Bawah */}
          <p className="mt-12 text-center text-[9px] font-medium uppercase tracking-[0.2em] text-muted/30 leading-relaxed max-w-2xl mx-auto">
            Dengan menggunakan layanan VisionStream, Anda dianggap menyetujui seluruh protokol privasi yang telah ditetapkan. Kami berkomitmen melindungi data pribadi Anda dengan standar keamanan perbankan.
          </p>
        </div>
      </main>

      {/* Footer Simple */}
      <footer className="border-t border-white/5 bg-black py-10 mt-10">
        <div className="container mx-auto px-6 text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-muted/10">
            &copy; 2026 VisionStream Production &bull; Privacy Governance
          </p>
        </div>
      </footer>
    </div>
  );
}