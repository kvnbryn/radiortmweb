import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ChannelGrid from "@/components/ChannelGrid";
import ShortsSection from "@/components/ShortsSection";
import Link from "next/link";
import prisma from "@/lib/prisma";

// Revalidasi data setiap 60 detik (ISR) biar web tetap ngebut tapi data up-to-date
export const revalidate = 60;

export default async function Home() {
  // Ambil maksimal 6 kategori dari database untuk ditampilkan di Homepage
  const categoriesDb = await prisma.category.findMany({
    take: 6,
    orderBy: { createdAt: "desc" }
  });

  // Ambil pengaturan dinamis dari database untuk Branding
  const setting = await prisma.setting.findFirst();
  const siteName = setting?.siteName || "Live Stream";

  // Array gambar fallback kalau di database tidak di-upload thumbnail
  const fallbackImages = [
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1514539079130-25950c84af65?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1438032005730-c779502df39b?q=80&w=600&auto=format&fit=crop',
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-accent selection:text-white">
      {/* Navbar fixed di paling atas, z-50 */}
      <Navbar />

      <main className="flex-grow">
        {/* Section 1: Hero (Headline Siaran) */}
        <Hero />

        {/* Section 2: Konten Utama */}
        <div className="relative z-30 -mt-8 space-y-12 pb-24 sm:-mt-10 md:-mt-12 md:space-y-16 lg:-mt-21 lg:space-y-20">
          
          {/* Channel TV - Otomatis ngambil dari API */}
          <div>
            <ChannelGrid 
              title="TV LIVE" 
              type="tv" 
              count={6} 
            />
          </div>

          {/* SEKSI SHORTS - Sistem Baru: Klik untuk Fullscreen Player */}
          <section className="container mx-auto px-6 md:px-12">
            <h2 className="mb-6 flex items-center gap-3 text-xl font-bold tracking-tight text-white md:text-2xl lg:mb-8 uppercase">
              Shorts
            </h2>
            <ShortsSection />
          </section>

          {/* Radio Section */}
          <div>
            <ChannelGrid 
              title="RADIO ONLINE" 
              type="radio" 
              count={6} 
            />
          </div>

          {/* Category Section */}
          <section className="container mx-auto px-6 md:px-12">
            <h2 className="mb-6 flex items-center gap-3 text-xl font-bold tracking-tight text-white md:text-2xl lg:mb-8">
              Jelajahi Kategori
            </h2>
            
            {categoriesDb.length === 0 ? (
              <p className="text-muted text-sm">Kategori belum tersedia di database.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6">
                {categoriesDb.map((cat, index) => {
                  const bgImg = cat.thumbnail || fallbackImages[index % fallbackImages.length];
                  return (
                    <Link 
                      href={`/category?filter=${cat.name}`}
                      key={cat.id} 
                      className="group relative flex aspect-square md:aspect-[4/5] lg:aspect-[4/5] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-surface shadow-lg transition-all duration-500 hover:-translate-y-2 hover:border-white/30 hover:shadow-[0_15px_30px_rgba(229,9,20,0.3)]"
                    >
                      <div 
                        className="absolute inset-0 z-0 bg-cover bg-center opacity-40 mix-blend-luminosity transition-transform duration-700 group-hover:scale-110"
                        style={{ backgroundImage: `url('${bgImg}')` }}
                      />
                      <div className="absolute inset-0 z-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
                      <div 
                        className="absolute top-[110%] left-1/2 z-10 w-[250%] aspect-square -translate-x-1/2 rounded-[40%] bg-accent opacity-90 transition-all duration-[1200ms] ease-in-out group-hover:top-[30%] group-hover:rotate-[120deg] group-active:top-[-50%] group-active:rotate-[200deg] group-active:duration-500"
                      />
                      <span 
                        className="relative z-20 text-lg md:text-xl lg:text-2xl font-black text-transparent transition-colors duration-[800ms] group-hover:text-white group-active:scale-95 text-center px-3 break-words whitespace-normal leading-snug drop-shadow-lg"
                        style={{ 
                          WebkitTextStroke: '1.2px rgba(255,255,255,0.8)', 
                          wordBreak: 'break-word' 
                        }}
                      >
                        {cat.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Footer Minimalis */}
      <footer className="relative z-20 border-t border-white/10 bg-background py-10">
        <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-6 md:flex-row md:px-12">
          <p className="text-center text-xs font-medium uppercase tracking-widest text-muted/50 md:text-left">
            &copy; {new Date().getFullYear()} {siteName} Production.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-[10px] font-bold uppercase tracking-wider text-muted/40 md:justify-end">
            <Link href="/terms" className="cursor-pointer transition-colors hover:text-white">Syarat & Ketentuan</Link>
            <Link href="/privacy" className="cursor-pointer transition-colors hover:text-white">Kebijakan Privasi</Link>
            <Link href="/help" className="cursor-pointer transition-colors hover:text-white">Bantuan</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}