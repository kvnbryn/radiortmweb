"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PlayCircle, Radio as RadioIcon } from "lucide-react";
import Link from "next/link";

interface ChannelGridProps {
  title: string;
  type: "tv" | "radio";
  count: number;
  categoryName?: string;
}

export default function ChannelGrid({ title, type, count, categoryName }: ChannelGridProps) {
  const [channels, setChannels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/${type}`);
        const json = await res.json();
        if (json.success) {
          let filtered = json.data.filter((item: any) => item.status === "LIVE");
          
          if (categoryName && categoryName !== "Semua") {
            filtered = filtered.filter((item: any) => item.category?.name === categoryName);
          }
          
          // SORTING: Prioritaskan channel yang di-pin agar muncul paling pertama
          filtered.sort((a: any, b: any) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            // Jika status pin sama, urutkan berdasarkan jumlah penonton terbanyak sebagai fallback
            return (b.viewers || 0) - (a.viewers || 0);
          });
          
          setChannels(filtered.slice(0, count));
        }
      } catch (error) {
        console.error("Failed to fetch channels", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [type, count, categoryName]);

  const placeholders = Array.from({ length: count });

  return (
    <section className="container mx-auto px-6 md:px-12">
      {/* Header Section */}
      <div className="mb-4 flex items-center justify-between gap-4 md:mb-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
          <h2 className="truncate text-lg font-bold tracking-tight text-white md:text-2xl">
            {title}
          </h2>
          {type === "tv" && (
            <span className="flex h-2 w-2 shrink-0 animate-pulse rounded-full bg-accent shadow-[0_0_10px_rgba(229,9,20,0.8)] md:h-2.5 md:w-2.5" />
          )}
        </div>
        <Link href={`/${type}`} className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-muted transition-colors hover:text-white md:text-sm">
          Lihat Semua
        </Link>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
        
        {/* Loading State */}
        {isLoading && placeholders.map((_, index) => (
          // Menyembunyikan skeleton ke-6 di layar 'lg' (5 kolom) agar tidak nanggung di baris baru
          <div key={`skeleton-${index}`} className={`group relative ${index === 5 ? 'lg:hidden xl:block' : ''}`}>
            <div className={`relative overflow-hidden rounded-xl border border-white/5 bg-surface ${type === "tv" ? "aspect-video" : "aspect-square"}`}>
              <div className="absolute inset-0 z-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
              <div className="h-full w-full bg-[#1C1C1E] z-0" />
            </div>
            <div className="mt-3 space-y-2">
              <div className="h-4 w-3/4 rounded bg-white/10 animate-pulse" />
              <div className="h-3 w-1/2 rounded bg-white/5 animate-pulse" />
            </div>
          </div>
        ))}

        {/* Empty State */}
        {!isLoading && channels.length === 0 && (
          <div className="col-span-full py-10 text-center border border-dashed border-white/10 rounded-2xl bg-surface/30">
            <p className="text-sm font-bold text-muted">Belum ada siaran {type.toUpperCase()} yang sedang Live.</p>
          </div>
        )}

        {/* Data Loaded */}
        {!isLoading && channels.map((item, index) => (
          <motion.div
            key={item.id}
            // Menyembunyikan item ke-6 di layar 'lg' (5 kolom) agar row tetap full
            className={index === 5 ? "lg:hidden xl:block" : ""}
            whileHover={{ y: -8, scale: 1.03 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Link href={`/${type}/${item.slug}`} className="group relative block cursor-pointer">
              
              <div className={`relative overflow-hidden rounded-xl border border-white/5 bg-surface transition-all duration-300 group-hover:border-accent/50 group-hover:shadow-[0_10px_30px_rgba(229,9,20,0.2)] ${
                type === "tv" ? "aspect-video" : "aspect-square"
              }`}>
                
                <div className="h-full w-full bg-[#1C1C1E] z-0 absolute inset-0" />
                {item.thumbnail && (
                  <img 
                    src={item.thumbnail} 
                    alt={item.name}
                    className="absolute inset-0 z-0 h-full w-full object-cover opacity-70 transition-transform duration-500 group-hover:scale-110 group-hover:opacity-40" 
                  />
                )}
                
                <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:scale-110 group-hover:opacity-100">
                  {type === "tv" ? (
                    <PlayCircle className="text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]" size={42} strokeWidth={1.5} />
                  ) : (
                    <RadioIcon className="text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]" size={38} strokeWidth={1.5} />
                  )}
                </div>

                <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col justify-end bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/90 to-transparent p-3 opacity-100 md:opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:p-4">
                  <p className="text-[9px] font-black tracking-widest text-accent drop-shadow-md md:text-[10px]">LIVE NOW</p>
                  <h3 className="line-clamp-1 text-xs font-bold text-white drop-shadow-md md:text-sm">{item.name}</h3>
                </div>

                <div className="absolute left-2 top-2 z-20 flex gap-1">
                  {/* Badge Resolusi/Bitrate */}
                  <div className="rounded bg-black/80 px-2 py-1 text-[8px] font-bold tracking-widest text-white shadow-md backdrop-blur-md border border-white/10 md:text-[9px] uppercase">
                    {type === "tv" ? item.resolution : item.bitrate}
                  </div>
                </div>
              </div>

              <div className="mt-3 opacity-100 transition-opacity duration-300 group-hover:opacity-70">
                <div className="flex items-center gap-2">
                  <h3 className="line-clamp-1 text-sm font-semibold text-white/90" title={item.name}>{item.name}</h3>
                </div>
                <p className="mt-0.5 text-[11px] font-medium text-muted/60 truncate">
                  {item.category?.name || "Uncategorized"}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}