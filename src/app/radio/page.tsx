import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function RadioIndexPage() {
  try {
    // Mencari stasiun radio pertama yang aktif/LIVE di database
    const firstRadio = await prisma.radioChannel.findFirst({
      where: {
          status: "LIVE"
      },
      orderBy: { createdAt: 'asc' }
    });

    if (firstRadio && firstRadio.slug) {
      // Langsung Bypass & Redirect ke halaman Player Radio tanpa render UI hijau
      redirect(`/radio/${firstRadio.slug}`);
    } else {
      // Fallback jika tidak ada radio yang aktif, cari radio apa saja
      const anyRadio = await prisma.radioChannel.findFirst({
          orderBy: { createdAt: 'asc' }
      });
      if (anyRadio && anyRadio.slug) {
          redirect(`/radio/${anyRadio.slug}`);
      }
    }
  } catch (error) {
    console.error("Error fetching radio for redirect:", error);
  }

  // Fallback UI yang profesional (jika database radio kosong karena belum ada data dari admin)
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
      <div className="text-center space-y-6">
        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(220,38,38,0.2)]">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/>
            <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/>
            <circle cx="12" cy="12" r="2"/>
            <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/>
            <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/>
          </svg>
        </div>
        <h1 className="text-4xl font-black uppercase tracking-[0.2em]">Belum Ada Siaran</h1>
        <p className="text-zinc-500 text-sm font-mono tracking-widest uppercase">
          Sistem belum memiliki data stasiun radio.<br/>Silakan tambahkan melalui Admin Panel.
        </p>
      </div>
    </div>
  );
}