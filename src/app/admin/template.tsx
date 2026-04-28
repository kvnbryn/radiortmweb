"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function AdminTemplate({ children }: { children: React.ReactNode }) {
  // State untuk ngatur kapan konten asli boleh dimunculin
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Trik Artificial Delay ala WFlix/Netflix (400ms)
    // Ini buat nyamarin proses compiling di Dev Mode, 
    // dan ngasih ilusi transisi yang elegan di Production.
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  // Selama delay belum selesai, tampilin spinner premium ini
  if (!isReady) {
    return (
      <div className="flex h-[70vh] w-full flex-col items-center justify-center animate-in fade-in duration-300">
        
        {/* Efek Glow di belakang spinner */}
        <div className="absolute flex items-center justify-center opacity-20">
          <div className="h-32 w-32 rounded-full bg-accent/20 blur-[60px]" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="relative flex items-center justify-center">
            <div className="absolute inline-flex h-16 w-16 animate-ping rounded-full bg-accent/20" />
            <Loader2 
              size={48} 
              className="animate-spin text-accent drop-shadow-[0_0_15px_rgba(229,9,20,0.6)]" 
              strokeWidth={1.5} 
            />
          </div>

          {/* Skeleton Text untuk ilusi loading data */}
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-sm font-bold tracking-widest text-white uppercase drop-shadow-md">
              Menarik Data Server...
            </p>
            <div className="flex gap-1.5">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted/60" style={{ animationDelay: "0ms" }} />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted/60" style={{ animationDelay: "150ms" }} />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted/60" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        </div>

      </div>
    );
  }

  // Kalau delay udah kelar, munculin halamannya dengan animasi framer-motion yang smooth dari bawah ke atas
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}