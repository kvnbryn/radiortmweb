"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume2, Share2, Users, Activity, Disc, ArrowLeft, Headphones } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";

export default function RadioPlayerPage({ params }: { params: { slug: string } }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [radioData, setRadioData] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [branding, setBranding] = useState({ siteName: "" });
  const audioRef = useRef<HTMLAudioElement>(null);

  const STREAM_URL = "http://141.11.25.59:8000/live";

  useEffect(() => {
    fetch("/api/settings").then(res => res.json()).then(json => {
      if (json.success && json.data) setBranding({ siteName: json.data.siteName });
    });

    fetch(`/api/radio?slug=${params.slug}`).then(res => res.json()).then(json => {
      if (json.success) setRadioData(json.data);
      setIsLoaded(true);
    });
  }, [params.slug]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else {
        audioRef.current.load();
        audioRef.current.play().catch(() => {
          alert("OFFLINE: Sinyal studio belum aktif.");
          setIsPlaying(false);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (!isLoaded) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080808] text-white selection:bg-accent relative overflow-hidden">
      <Navbar />
      
      {/* Immersive Spotify Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/20 via-[#080808] to-[#080808]" />
        {radioData?.logoUrl && (
          <motion.img 
            initial={{ opacity: 0 }} animate={{ opacity: 0.15 }}
            src={radioData.logoUrl} className="w-full h-full object-cover blur-[150px] scale-150" 
          />
        )}
      </div>

      <main className="relative z-10 container mx-auto px-6 lg:px-20 pt-32 pb-20">
        <div className="flex flex-col lg:flex-row items-center lg:items-end gap-10 lg:gap-14">
          
          {/* Animated Artwork */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="relative group"
          >
            <div className={`absolute -inset-10 bg-accent/30 rounded-full blur-[100px] transition-all duration-1000 ${isPlaying ? 'opacity-100' : 'opacity-0'}`} />
            <div className="w-64 h-64 md:w-80 md:h-80 bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] relative z-10">
              {radioData?.logoUrl ? (
                <img src={radioData.logoUrl} className={`w-full h-full object-cover transition-transform duration-[20s] linear infinite ${isPlaying ? 'scale-110 rotate-3' : 'scale-100'}`} alt="" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-950"><Disc size={100} className="text-zinc-800" /></div>
              )}
            </div>
          </motion.div>

          {/* Identity Section */}
          <div className="flex flex-col gap-6 text-center lg:text-left">
            <motion.span 
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className="text-[10px] font-black uppercase tracking-[0.5em] text-accent flex items-center justify-center lg:justify-start gap-2"
            >
              <Headphones size={12} /> Live Streaming
            </motion.span>
            <motion.h1 
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
              className="text-7xl md:text-[120px] font-black tracking-[-0.05em] uppercase leading-[0.8] italic"
            >
              {radioData?.name || "Station"}
            </motion.h1>
            
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="flex items-center justify-center lg:justify-start gap-8 text-zinc-500 text-[10px] font-bold uppercase tracking-widest"
            >
              <div className="flex items-center gap-2 border-r border-white/10 pr-8">
                <Users size={14} className="text-accent" />
                <span>1,242 Listeners</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity size={14} />
                <span>128 KBPS High-Def</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Action Controller Bar */}
        <motion.div 
          initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
          className="mt-16 flex flex-wrap items-center justify-center lg:justify-start gap-10"
        >
          <button 
            onClick={togglePlay}
            className="w-20 h-20 rounded-full bg-accent text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-2xl shadow-accent/50 group"
          >
            {isPlaying ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" className="ml-1" />}
          </button>
          
          <div className="flex items-center gap-6">
            <button className="text-zinc-500 hover:text-white transition-colors"><Share2 size={24} /></button>
          </div>

          <div className="hidden md:flex items-center gap-4 w-64 group">
            <Volume2 size={20} className="text-zinc-500 group-hover:text-accent transition-colors" />
            <input 
              type="range" min="0" max="100" value={volume} 
              onChange={(e) => {
                setVolume(parseInt(e.target.value));
                if(audioRef.current) audioRef.current.volume = parseInt(e.target.value) / 100;
              }}
              className="flex-1 accent-accent bg-white/5 h-1 appearance-none cursor-pointer rounded-full" 
            />
          </div>
        </motion.div>

        {/* Minimalist Spotify Stats Row */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-1 border-t border-white/5">
           {[
             { label: "Studio Hub", val: "Jakarta Pusat" },
             { label: "Server Node", val: "Core-JKT-01" },
             { label: "Stability", val: "99.9% Uptime" }
           ].map((item, i) => (
             <div key={i} className="p-10 bg-white/[0.01] hover:bg-white/[0.03] transition-all group border-r border-white/5 last:border-r-0">
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2">{item.label}</p>
                <p className="text-xs font-bold text-zinc-400 group-hover:text-white transition-colors">{item.val}</p>
             </div>
           ))}
        </div>
      </main>

      <audio ref={audioRef} src={STREAM_URL} preload="none" crossOrigin="anonymous" />
    </div>
  );
}