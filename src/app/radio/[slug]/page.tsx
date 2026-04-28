"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume2, Radio, Share2, Heart, Users, Music2, Disc, Activity } from "lucide-react";
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
    // Ambil Branding secara dinamis
    fetch("/api/settings")
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) setBranding({ siteName: json.data.siteName });
      });

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/radio?slug=${params.slug}`);
        const json = await res.json();
        if (json.success) setRadioData(json.data);
      } catch (error) {
        console.error("Fetch error");
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
      <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!radioData) return <div className="min-h-screen bg-black flex items-center justify-center text-accent font-black uppercase tracking-widest">404 STATION NOT FOUND</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-accent selection:text-white">
      <Navbar />
      
      {/* Spotify Industrial View */}
      <div className="relative pt-32 pb-12 px-6 md:px-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          {radioData.logoUrl ? (
            <img src={radioData.logoUrl} className="w-full h-full object-cover opacity-20 blur-[120px] scale-150" alt="" />
          ) : (
            <div className="w-full h-full bg-accent/5 blur-[100px]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/90 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-10">
          <div className="relative">
            <div className={`absolute -inset-8 bg-accent/10 rounded-full blur-3xl transition-all duration-1000 ${isPlaying ? 'opacity-100' : 'opacity-0'}`} />
            <div className="w-64 h-64 md:w-80 md:h-80 bg-surface border border-white/5 rounded-none overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] relative z-10 flex items-center justify-center">
              {radioData.logoUrl ? (
                <img 
                  src={radioData.logoUrl} 
                  className={`w-full h-full object-cover transition-transform duration-[10s] ${isPlaying ? 'scale-110' : 'scale-100'}`} 
                  alt="" 
                />
              ) : (
                <Disc size={100} className={`text-accent/10 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-6 text-center md:text-left">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">Broadcast Live // {branding.siteName}</span>
            <h1 className="text-6xl md:text-[120px] font-black tracking-[ -0.05em] uppercase leading-[0.8] italic">
              {radioData.name}
            </h1>
            <div className="flex items-center justify-center md:justify-start gap-5 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <Users size={12} className="text-accent" />
                <span>1,242</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity size={12} />
                <span>128 KBPS</span>
              </div>
              <span className="text-white/20">Node: JKT-01</span>
            </div>
          </div>
        </div>
      </div>

      {/* Industrial Controller Bar */}
      <div className="sticky top-[70px] z-30 bg-[#050505]/95 backdrop-blur-2xl border-y border-white/5 px-6 md:px-16 py-6 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <button 
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-accent text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-accent/40"
          >
            {isPlaying ? <Pause size={30} fill="currentColor" /> : <Play size={30} fill="currentColor" className="ml-1" />}
          </button>
          <div className="flex items-center gap-6 text-zinc-600">
             <Heart size={22} className="hover:text-accent cursor-pointer transition-colors" />
             <Share2 size={22} className="hover:text-white cursor-pointer transition-colors" />
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4 w-64">
          <Volume2 size={18} className="text-zinc-600" />
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={volume}
            onChange={(e) => {
              setVolume(parseInt(e.target.value));
              if(audioRef.current) audioRef.current.volume = parseInt(e.target.value) / 100;
            }}
            className="flex-1 accent-accent bg-white/5 h-0.5 appearance-none cursor-pointer"
          />
        </div>
      </div>

      <main className="px-6 md:px-16 py-20">
         <div className="flex items-center gap-4 mb-10">
            <div className="h-px flex-1 bg-white/5" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-700">Studio Session Logs</h3>
            <div className="h-px flex-1 bg-white/5" />
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-8 bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all group cursor-not-allowed">
                 <p className="text-[10px] font-black text-zinc-600 uppercase mb-2">Session 0{i}</p>
                 <p className="text-xs font-bold text-zinc-400 uppercase tracking-tight">Broadcast Archived</p>
              </div>
            ))}
         </div>
      </main>

      <audio ref={audioRef} src={STREAM_URL} preload="none" crossOrigin="anonymous" />
    </div>
  );
}