"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume2, Share2, Users, Activity, Disc, Headphones } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";

export default function RadioPlayerPage({ params }: { params: { slug: string } }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [radioData, setRadioData] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [branding, setBranding] = useState({ siteName: "" });
  const [viewerCount, setViewerCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Link Stream dari VPS lo
  const STREAM_URL = "http://141.11.25.59:8000/live";

  useEffect(() => {
    // 1. Ambil Branding dari Setting
    fetch("/api/settings").then(res => res.json()).then(json => {
      if (json.success && json.data) setBranding({ siteName: json.data.siteName });
    });

    // 2. Load Data Radio berdasarkan slug
    const fetchRadio = async () => {
        const res = await fetch(`/api/radio?slug=${params.slug}`);
        const json = await res.json();
        if (json.success) {
            setRadioData(json.data);
            setViewerCount(json.data.listeners || 0); // Ambil data awal dari DB
        }
        setIsLoaded(true);
    };
    fetchRadio();
  }, [params.slug]);

  // 3. Heartbeat Logic (Viewer Count)
  useEffect(() => {
    if (!radioData || !isPlaying) return;

    // Bikin identifier unik buat user ini (simpan di browser)
    let viewerId = localStorage.getItem("vs_viewer_id");
    if (!viewerId) {
        viewerId = "viewer_" + Math.random().toString(36).substring(2, 11);
        localStorage.setItem("vs_viewer_id", viewerId);
    }

    const sendHeartbeat = async () => {
        try {
            const res = await fetch('/api/viewers/heartbeat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    identifier: viewerId,
                    channelId: radioData.id, // Pakai ID (angka), bukan slug
                    channelType: "radio"
                })
            });
            const json = await res.json();
            if (json.success) setViewerCount(json.viewers); // Update angka viewer di UI
        } catch (e) { console.error("Heartbeat fail"); }
    };

    // Kirim pertama kali saat play
    sendHeartbeat();

    // Kirim tiap 30 detik selama lagu diputar
    const interval = setInterval(sendHeartbeat, 30000);
    return () => clearInterval(interval);
  }, [radioData, isPlaying]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else {
        audioRef.current.load();
        audioRef.current.play().catch(() => {
          alert("Sinyal studio sedang offline.");
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
    <div className="min-h-screen bg-[#080808] text-white selection:bg-accent relative overflow-hidden font-sans">
      <Navbar />
      
      {/* Spotify Gradient Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/20 via-[#080808] to-[#080808]" />
        {radioData?.thumbnail && (
          <motion.img 
            initial={{ opacity: 0 }} animate={{ opacity: 0.15 }}
            src={radioData.thumbnail} className="w-full h-full object-cover blur-[150px] scale-150" 
          />
        )}
      </div>

      <main className="relative z-10 container mx-auto px-6 lg:px-20 pt-28 pb-10">
        <div className="flex flex-col lg:flex-row items-center lg:items-end gap-10 lg:gap-14">
          
          {/* Artwork */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="relative"
          >
            <div className={`absolute -inset-10 bg-accent/20 rounded-full blur-[100px] transition-all duration-1000 ${isPlaying ? 'opacity-100' : 'opacity-0'}`} />
            <div className="w-64 h-64 md:w-80 md:h-80 bg-zinc-900 border border-white/5 rounded-xl overflow-hidden shadow-2xl relative z-10">
              {radioData?.thumbnail ? (
                <img src={radioData.thumbnail} className={`w-full h-full object-cover transition-transform duration-[20s] linear infinite ${isPlaying ? 'scale-110 rotate-2' : 'scale-100'}`} alt="" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-950"><Disc size={100} className="text-zinc-800" /></div>
              )}
            </div>
          </motion.div>

          {/* Identity - Clean & Spotify Look */}
          <div className="flex flex-col gap-4 text-center lg:text-left">
            <motion.span 
              initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className="text-[10px] font-black uppercase tracking-[0.4em] text-accent flex items-center justify-center lg:justify-start gap-2"
            >
              <Activity size={12} className="animate-pulse" /> Live Now
            </motion.span>
            
            <motion.h1 
              initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className="text-6xl md:text-[120px] font-black tracking-[-0.05em] uppercase leading-none italic"
            >
              {radioData?.name}
            </motion.h1>
            
            <div className="flex items-center justify-center lg:justify-start gap-6 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-accent" />
                <span>{viewerCount.toLocaleString()} Listeners</span>
              </div>
              <span className="w-1 h-1 bg-zinc-700 rounded-full" />
              <span>{branding.siteName} Digital Stream</span>
            </div>
          </div>
        </div>

        {/* Player Controls - Tighter & Responsive */}
        <div className="mt-12 flex items-center justify-center lg:justify-start gap-8">
          <button 
            onClick={togglePlay}
            className="w-20 h-20 rounded-full bg-accent text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-accent/40"
          >
            {isPlaying ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" className="ml-1" />}
          </button>
          
          <button className="p-4 rounded-full bg-white/5 border border-white/5 text-zinc-400 hover:text-white transition-all">
            <Share2 size={24} />
          </button>

          <div className="hidden md:flex items-center gap-4 w-52 ml-4">
            <Volume2 size={18} className="text-zinc-500" />
            <input 
              type="range" min="0" max="100" value={volume} 
              onChange={(e) => {
                setVolume(parseInt(e.target.value));
                if(audioRef.current) audioRef.current.volume = parseInt(e.target.value) / 100;
              }}
              className="flex-1 accent-accent bg-white/5 h-1 appearance-none cursor-pointer rounded-full" 
            />
          </div>
        </div>
      </main>

      <audio ref={audioRef} src={STREAM_URL} preload="none" crossOrigin="anonymous" />
    </div>
  );
}