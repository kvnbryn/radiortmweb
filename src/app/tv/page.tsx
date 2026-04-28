"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Tv, PlayCircle, Loader2, Pin } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Channel {
  id: number;
  name: string;
  slug: string;
  thumbnail: string | null;
  resolution: string;
  status: string;
  isPinned: boolean;
  createdAt: string;
  category?: { name: string };
}

export default function TvListPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resTv, resCat] = await Promise.all([
          fetch("/api/tv"),
          fetch("/api/categories")
        ]);
        
        const jsonTv = await resTv.json();
        const jsonCat = await resCat.json();

        if (jsonCat.success) {
          setCategories(jsonCat.data);
        }

        if (jsonTv.success) {
          // Filter hanya yang LIVE
          const liveChannels = jsonTv.data.filter((c: Channel) => c.status === "LIVE");
          
          // Urutkan: Pinned di atas, lalu berdasarkan yang terbaru
          const sortedChannels = liveChannels.sort((a: Channel, b: Channel) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });

          setChannels(sortedChannels);
        }
      } catch (err) {
        console.error("Gagal mengambil data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter channel berdasarkan kategori yang dipilih
  const displayChannels = selectedCategory === "All" 
    ? channels 
    : channels.filter(c => c.category?.name === selectedCategory);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="animate-spin text-accent" size={40} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-accent selection:text-white">
      <Navbar />

      <main className="flex-grow pt-24 md:pt-32 pb-20">
        <div className="container mx-auto px-6 md:px-12">
          
          {/* Header Halaman */}
          <div className="mb-8 max-w-3xl">
            <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-white md:text-5xl">
              <Tv className="text-accent" size={36} strokeWidth={2.5} />
              Siaran TV Live
            </h1>
            <p className="mt-4 text-sm text-muted md:text-lg leading-relaxed">
              Tonton seluruh siaran televisi, liputan langsung, dan acara eksklusif yang sedang mengudara saat ini.
            </p>
          </div>

          {/* Filter Kategori (Bentuk Persegi Panjang) */}
          <div className="mb-10 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setSelectedCategory("All")}
              className={`rounded-lg border px-5 py-2.5 text-sm font-bold transition-all ${
                selectedCategory === "All"
                  ? "bg-accent border-accent text-white shadow-[0_4px_15px_rgba(229,9,20,0.3)]"
                  : "bg-surface border-white/10 text-muted hover:bg-white/5 hover:text-white"
              }`}
            >
              Semua Siaran
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`rounded-lg border px-5 py-2.5 text-sm font-bold transition-all ${
                  selectedCategory === cat.name
                    ? "bg-accent border-accent text-white shadow-[0_4px_15px_rgba(229,9,20,0.3)]"
                    : "bg-surface border-white/10 text-muted hover:bg-white/5 hover:text-white"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Grid Siaran TV */}
          {displayChannels.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-24 border border-dashed border-white/10 rounded-3xl bg-surface/30"
            >
              <Tv size={48} className="text-muted/30 mb-4" />
              <p className="text-muted font-bold tracking-widest uppercase">
                {selectedCategory === "All" ? "Belum ada siaran TV yang On Air" : `Tidak ada siaran LIVE di kategori ${selectedCategory}`}
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              <AnimatePresence>
                {displayChannels.map((channel) => (
                  <motion.div
                    key={channel.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ y: -8, scale: 1.03 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Link href={`/tv/${channel.slug}`} className="group relative block cursor-pointer">
                      
                      {/* Card Thumbnail */}
                      <div className="relative overflow-hidden rounded-xl border border-white/5 bg-surface transition-all duration-300 group-hover:border-accent/50 group-hover:shadow-[0_10px_30px_rgba(229,9,20,0.2)] aspect-video">
                        <div className="h-full w-full bg-[#1C1C1E] z-0 absolute inset-0" />
                        
                        {channel.thumbnail && (
                          <img 
                            src={channel.thumbnail} 
                            alt={channel.name}
                            className="absolute inset-0 z-0 h-full w-full object-cover opacity-70 transition-transform duration-500 group-hover:scale-110 group-hover:opacity-40" 
                          />
                        )}
                        
                        {/* Icon Play Center */}
                        <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:scale-110 group-hover:opacity-100">
                          <PlayCircle className="text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]" size={42} strokeWidth={1.5} />
                        </div>

                        {/* Indikator Pinned di Kanan Atas (Opsional biar keliatan mana yang diprioritaskan) */}
                        {channel.isPinned && (
                          <div className="absolute top-0 right-0 z-20 bg-yellow-500 p-1.5 rounded-bl-lg shadow-md">
                            <Pin size={12} className="text-black fill-black" />
                          </div>
                        )}

                        {/* Info Overlay Bottom */}
                        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col justify-end bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/90 to-transparent p-3 opacity-100 md:opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:p-4">
                          <p className="text-[9px] font-black tracking-widest text-accent drop-shadow-md md:text-[10px]">LIVE NOW</p>
                          <h3 className="line-clamp-1 text-xs font-bold text-white drop-shadow-md md:text-sm">{channel.name}</h3>
                        </div>

                        {/* Badge Resolusi */}
                        <div className="absolute left-2 top-2 z-20 rounded bg-black/80 px-2 py-1 text-[8px] font-bold tracking-widest text-white shadow-md backdrop-blur-md border border-white/10 md:text-[9px] uppercase">
                          {channel.resolution}
                        </div>
                      </div>

                      {/* Meta Title di luar Card */}
                      <div className="mt-3 opacity-100 transition-opacity duration-300 group-hover:opacity-70">
                        <h3 className="line-clamp-1 text-sm font-semibold text-white/90" title={channel.name}>{channel.name}</h3>
                        <p className="mt-0.5 text-[11px] font-medium text-muted/60 truncate">
                          {channel.category?.name || "Uncategorized"}
                        </p>
                      </div>

                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}