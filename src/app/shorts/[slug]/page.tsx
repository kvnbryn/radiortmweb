import React from "react";
import prisma from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import { notFound } from "next/navigation";
import { Heart, Share2, Eye } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ShortDetailPage({ params }: Props) {
  const { slug } = await params;

  const short = await prisma.short.findUnique({
    where: { slug },
    include: {
      _count: {
        select: { likes: true }
      }
    }
  });

  if (!short) notFound();

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center p-0 sm:p-6 md:py-12">
        <div className="w-full max-w-[450px] h-[100dvh] sm:h-auto sm:aspect-[9/16] relative bg-zinc-950 sm:rounded-3xl overflow-hidden border-x sm:border border-white/10 shadow-2xl">
          
          {/* Iframe native autoplay aman karena halaman di-load secara individual */}
          <iframe
            src={`https://www.youtube.com/embed/${short.youtubeId}?autoplay=1&rel=0&modestbranding=1&controls=0&playsinline=1&loop=1&playlist=${short.youtubeId}`}
            className="w-full h-full pointer-events-none"
            allow="autoplay; encrypted-media; fullscreen"
          ></iframe>

          <div className="absolute inset-0 p-6 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none flex flex-col justify-end z-[10]">
            <div className="flex items-center gap-2 mb-4">
               <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
               <span className="text-[10px] font-black uppercase tracking-widest text-white">Vision Shorts</span>
            </div>
            
            <h1 className="text-xl font-black text-white leading-tight mb-6 drop-shadow-xl">{short.title}</h1>
            
            <div className="flex items-center gap-6 pointer-events-auto">
               <div className="flex flex-col items-center gap-1.5">
                 <div className="p-3 bg-black/40 rounded-full backdrop-blur-md border border-white/10">
                    <Heart size={20} className="text-accent fill-accent" />
                 </div>
                 <span className="text-[11px] font-bold text-white shadow-md">{short._count.likes}</span>
               </div>
               
               <div className="flex flex-col items-center gap-1.5">
                 <div className="p-3 bg-black/40 rounded-full backdrop-blur-md border border-white/10">
                    <Eye size={20} className="text-white/80" />
                 </div>
                 <span className="text-[11px] font-bold text-white/80 shadow-md">{short.views}</span>
               </div>

               <div className="ml-auto">
                 <button className="p-3 bg-black/40 rounded-full backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all">
                   <Share2 size={20} className="text-white" />
                 </button>
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}