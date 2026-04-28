"use client";

import React, { useState, useEffect, useRef } from "react";
// FIXED: Menambahkan 'Activity' ke dalam import
import { Play, Pause, Volume2, Radio, Share2, Heart, Users, Music2, Disc, Activity } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function RadioPlayerPage({ params }: { params: { slug: string } }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [radioData, setRadioData] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [branding, setBranding] = useState({ siteName: "VisionStream" });
  const audioRef = useRef<HTMLAudioElement>(null);

  const STREAM_URL = "http://141.11.25.59:8000/live";

  useEffect(() => {
    // Load Branding secara dinamis dari API Settings
    fetch("/api/settings")
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) setBranding({ siteName: json.data.siteName });
      });

    // Load Data Radio berdasarkan slug
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/radio?slug=${params.slug}`);
        const json = await res.json();
        if (json.success) setRadioData(json.data);
      } catch (error) {
        console.error("Gagal load data radio");
      } finally {
        setIsLoaded(true);
      }
    };
    fetchData();
  }, [params.slug]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        // Melakukan load ulang stream agar tidak delay (audio live)
        audioRef.current.load();
        audioRef.current.play().catch(() => {
          alert("STREAM OFFLINE: Pastikan stasiun pusat sudah melakukan 'Go On-Air'.");
          setIsPlaying(false);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (!isLoaded) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
      <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      <p className="text-accent font-black uppercase tracking-[0.5em] text-[10px]">{branding.siteName.toUpperCase()} LOADING...</p>
    </div>
  );

  if (!radioData) return <div className="min-h-screen bg-black flex items-center justify-center text-accent uppercase font-black tracking-widest">Station Not Found</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-accent selection:text-white">
      <Navbar />
      
      {/* Spotify Industrial Layout */}
      <div className="relative pt-32 pb-12 px-6 md:px-16 overflow-hidden">
        {/* Dynamic Background Blur - Ambil warna dari Logo */}
        <div className="absolute inset-0 z-0">
          {radioData.logoUrl ? (
            <img src={radioData.logoUrl} className="w-full h-full object-cover opacity-20 blur-[120px] scale-150" alt="" />
          ) : (
            <div className="w-full h-full bg-accent/10 blur-[100px]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-10">
          {/* Cover Art Section */}
          <div className="relative group">
            <div className={`absolute -inset-6 bg-accent/20 rounded-full blur-3xl transition-all duration-1000 ${isPlaying ? 'opacity-100' : 'opacity-0'}`} />
            <div className="w-64 h-64 md:w-80 md:h-80 bg-surface border border-white/10 rounded-none overflow-hidden shadow-2xl relative z-10 flex items-center justify-center">
              {radioData.logoUrl ? (
                <img 
                  src={radioData.logoUrl} 
                  className={`w-full h-full object-cover transition-transform duration-[10s] ${isPlaying ? 'scale-110' : 'scale-100'}`} 
                  alt={radioData.name} 
                />
              ) : (
                <Disc size={120} className={`text-accent/20 ${isPlaying ? 'animate-spin-slow' : ''}`} />
              )}
            </div>
          </div>
          
          {/* Station Identity */}
          <div className="flex flex-col gap-5 text-center md:text-left">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">
              Live Broadcast // {radioData.category?.name || "Digital"}
            </span>
            <h1 className="text-6xl md:text-9xl font-black tracking-tighter uppercase leading-none italic">
              {radioData.name}
            </h1>
            <div className="flex items-center justify-center md:justify-start gap-4 text-zinc-500 text-xs font-bold uppercase tracking-widest">
              <Users size={14} className="text-accent" />
              <span>1,242 Listeners</span>
              <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full" />
              <Activity size={14} />
              <span>128 Kbps</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar Section */}
      <div className="sticky top-[70px] z-30 bg-[#050505]/90 backdrop-blur-xl border-y border-white/5 px-6 md:px-16 py-6 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <button 
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-accent text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-accent/40"
          >
            {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
          </button>
          <div className="flex items-center gap-6 text-zinc-500">
             <Heart size={24} className="hover:text-accent cursor-pointer transition-colors" />
             <Share2 size={24} className="hover:text-white cursor-pointer transition-colors" />
          </div>
        </div>

        {/* Volume Control */}
        <div className="hidden md:flex items-center gap-4 w-64 group">
          <Volume2 size={20} className="text-zinc-500 group-hover:text-accent transition-colors" />
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={volume}
            onChange={(e) => {
              setVolume(parseInt(e.target.value));
              if(audioRef.current) audioRef.current.volume = parseInt(e.target.value) / 100;
            }}
            className="flex-1 accent-accent bg-white/10 h-1 appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* Secondary Content Section (Spotify Look) */}
      <main className="px-6 md:px-16 py-20 max-w-7xl">
         <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-10">Broadcast Sessions</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* List item simulasi arsip siaran */}
            <div className="p-6 bg-white/5 border border-white/5 flex items-center gap-6 hover:bg-white/10 transition-all group cursor-pointer">
               <div className="w-12 h-12 bg-accent/20 flex items-center justify-center text-accent font-black">01</div>
               <div>
                  <p className="text-xs font-black uppercase tracking-widest text-white">Digital Radio Morning Show</p>
                  <p className="text-[9px] text-zinc-600 uppercase font-bold mt-1 tracking-tighter">Live Recording // Current Session</p>
               </div>
            </div>
            <div className="p-6 bg-white/5 border border-white/5 flex items-center gap-6 hover:bg-white/10 transition-all group cursor-pointer opacity-50">
               <div className="w-12 h-12 bg-white/10 flex items-center justify-center text-zinc-600 font-black">02</div>
               <div>
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-600">Archived Stream Session</p>
                  <p className="text-[9px] text-zinc-800 uppercase font-bold mt-1 tracking-tighter">System Backup // 2026</p>
               </div>
            </div>
         </div>
      </main>

      <audio ref={audioRef} src={STREAM_URL} preload="none" crossOrigin="anonymous" />
      
      <style jsx>{`
        .animate-spin-slow { animation: spin 8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}