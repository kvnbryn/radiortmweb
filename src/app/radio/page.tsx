"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Headphones, Radio as RadioIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface RadioChannel {
  id: number;
  name: string;
  slug: string;
  thumbnail: string | null;
  bitrate: string;
  status: string;
  category?: { name: string };
}

export default function RadioListPage() {
  const [radios, setRadios] = useState<RadioChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRadios = async () => {
      try {
        const res = await fetch("/api/radio");
        const json = await res.json();
        if (json.success) {
          setRadios(json.data.filter((r: RadioChannel) => r.status === "LIVE"));
        }
      } catch (err) {
        console.error("Gagal mengambil data Radio", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRadios();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="animate-spin text-green-500" size={40} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-green-500 selection:text-white">
      <Navbar />

      <main className="flex-grow pt-24 md:pt-32 pb-20">
        <div className="container mx-auto px-6 md:px-12">
          
          {/* Header Halaman */}
          <div className="mb-10 max-w-2xl">
            <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-white md:text-5xl">
              <Headphones className="text-green-500" size={36} strokeWidth={2.5} />
              Radio Station
            </h1>
            <p className="mt-4 text-sm text-muted md:text-lg leading-relaxed">
              Dengarkan berbagai saluran stasiun radio favorit Anda secara langsung dengan kualitas audio premium.
            </p>
          </div>

          {/* Grid Siaran Radio */}
          {radios.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 border border-dashed border-white/10 rounded-3xl bg-surface/30">
              <RadioIcon size={48} className="text-muted/30 mb-4" />
              <p className="text-muted font-bold tracking-widest uppercase">Belum ada stasiun Radio yang On Air</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {radios.map((radio) => (
                <motion.div
                  key={radio.id}
                  whileHover={{ y: -8, scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Link href={`/radio/${radio.slug}`} className="group relative block cursor-pointer">
                    
                    {/* Card Thumbnail */}
                    <div className="relative overflow-hidden rounded-xl border border-white/5 bg-surface transition-all duration-300 group-hover:border-green-500/50 group-hover:shadow-[0_10px_30px_rgba(34,197,94,0.15)] aspect-square">
                      <div className="h-full w-full bg-[#1C1C1E] z-0 absolute inset-0" />
                      
                      {radio.thumbnail ? (
                        <img 
                          src={radio.thumbnail} 
                          alt={radio.name}
                          className="absolute inset-0 z-0 h-full w-full object-cover opacity-70 transition-transform duration-500 group-hover:scale-110 group-hover:opacity-40" 
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500">
                           <RadioIcon size={64} className="text-green-500" />
                        </div>
                      )}
                      
                      {/* Icon Center */}
                      <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:scale-110 group-hover:opacity-100">
                        <RadioIcon className="text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]" size={38} strokeWidth={1.5} />
                      </div>

                      {/* Info Overlay Bottom */}
                      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col justify-end bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/90 to-transparent p-3 opacity-100 md:opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:p-4">
                        <p className="text-[9px] font-black tracking-widest text-green-500 drop-shadow-md md:text-[10px]">ON AIR</p>
                        <h3 className="line-clamp-1 text-xs font-bold text-white drop-shadow-md md:text-sm">{radio.name}</h3>
                      </div>

                      {/* Badge Bitrate */}
                      <div className="absolute left-2 top-2 z-20 rounded bg-black/80 px-2 py-1 text-[8px] font-bold tracking-widest text-white shadow-md backdrop-blur-md border border-white/10 md:text-[9px] uppercase">
                        {radio.bitrate}
                      </div>
                    </div>

                    {/* Meta Title di luar Card */}
                    <div className="mt-3 opacity-100 transition-opacity duration-300 group-hover:opacity-70">
                      <h3 className="line-clamp-1 text-sm font-semibold text-white/90" title={radio.name}>{radio.name}</h3>
                      <p className="mt-0.5 text-[11px] font-medium text-muted/60 truncate">
                        {radio.category?.name || "Uncategorized"}
                      </p>
                    </div>

                  </Link>
                </motion.div>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}