"use client";

import React, { useState, useEffect, Suspense } from "react";
import Navbar from "@/components/Navbar";
import ChannelGrid from "@/components/ChannelGrid";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";

interface Category {
  id: string | number;
  name: string;
}

// Komponen dipisah biar bisa dibungkus Suspense (wajib kalau pakai useSearchParams di Next.js)
function CategoryContent() {
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter");
  
  // Kalau ada parameter ?filter= di URL (dari klik beranda), jadikan kategori aktif
  const [activeCategory, setActiveCategory] = useState(filterParam || "Semua");
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Update activeCategory kalau filterParam berubah
  useEffect(() => {
    if (filterParam) {
      setActiveCategory(filterParam);
    }
  }, [filterParam]);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (data.success) {
          setCategories([{ name: "Semua", id: "all" }, ...data.data]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={40} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-0 md:px-12">
      
      <div className="mb-6 px-6 md:mb-10 text-left">
        <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-white md:text-5xl lg:text-6xl">
          Eksplorasi
        </h1>
        <p className="mt-2 text-sm text-muted md:mt-4 md:text-lg max-w-2xl">
          Temukan siaran TV dan Radio berdasarkan kategori minat Anda.
        </p>
      </div>

      <div className="sticky top-[70px] z-40 w-full bg-background/90 backdrop-blur-xl border-b border-white/5 pb-4 pt-2 md:static md:bg-transparent md:border-none md:pb-0 md:pt-0">
        <div className="flex overflow-x-auto px-6 pb-2 pt-2 md:flex-wrap md:px-0 md:pb-8 custom-scrollbar-hide gap-2 md:gap-3">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.name;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.name)}
                className={`relative whitespace-nowrap rounded-full px-5 py-2 text-sm font-bold transition-colors duration-300 md:px-6 md:py-2.5 ${
                  isActive ? "text-white" : "text-muted hover:text-white"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeCategoryPill"
                    className="absolute inset-0 z-0 rounded-full bg-accent border border-accent shadow-[0_0_15px_rgba(229,9,20,0.4)]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 px-6 md:mt-0 md:px-0 min-h-[50vh]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="space-y-12 md:space-y-16"
          >
            {/* INI KUNCI FIX-NYA: Prop categoryName dikirim ke ChannelGrid */}
            <ChannelGrid 
              title={activeCategory === "Semua" ? "TV Live" : `TV Live - ${activeCategory}`} 
              type="tv" 
              count={12} 
              categoryName={activeCategory}
            />
            
            <ChannelGrid 
              title={activeCategory === "Semua" ? "Radio Online" : `Radio - ${activeCategory}`} 
              type="radio" 
              count={12} 
              categoryName={activeCategory}
            />
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}

export default function CategoryPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-accent selection:text-white">
      <Navbar />

      <main className="flex-grow pt-24 md:pt-28 pb-20">
        <Suspense fallback={
          <div className="flex h-screen items-center justify-center">
            <Loader2 className="animate-spin text-accent" size={40} />
          </div>
        }>
          <CategoryContent />
        </Suspense>
      </main>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar-hide::-webkit-scrollbar { display: none; }
        .custom-scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}