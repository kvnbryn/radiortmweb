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

  const STREAM_URL = "http://141.11.25.59:8000/live";

  useEffect(() => {
    // 1. Branding Dinamis
    fetch("/api/settings").then(res => res.json()).then(json => {
      if (json.success && json.data) setBranding({ siteName: json.data.siteName });
    });

    // 2. Load Data Radio
    const fetchRadio = async () => {
        const res = await fetch(`/api/radio?slug=${params.slug}`);
        const json = await res.json();
        if (json.success) {
            setRadioData(json.data);
            setViewerCount(json.data.listeners || 0);
        }
        setIsLoaded(true);
    };
    fetchRadio();
  }, [params.slug]);

  // 3. Heartbeat Logic - Fix Error 400
  useEffect(() => {
    // Pastikan radioData sudah ada dan sedang playing sebelum kirim heartbeat
    if (!radioData || !isPlaying || !radioData.id) return;

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
                    channelId: Number(radioData.id), // Pastikan ini angka
                    channelType: "radio"
                })
            });
            const json = await res.json();
            if (json.success) setViewerCount(json.viewers);
        } catch (e) {
            console.error("Heartbeat sync failed");
        }
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 30000);
    return () => clearInterval(interval);
  }, [radioData, isPlaying]);

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
    <div className="min-h-screen bg-[#080808] text-white selection:bg-accent relative overflow-hidden font-sans">
      <Navbar />
      
      {/* Spotify Immersive Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/25 via-[#080808] to-[#080808]" />
        {radioData?.thumbnail && (
          <motion.img 
            initial={{ opacity: 0 }} animate={{ opacity: 0.2 }}
            src={radioData.thumbnail} className="w-full h-full object-cover blur-[140px] scale-150" 
          />
        )}
      </div>

      <main className="relative z-10 container mx-auto px-6 lg:px-24 pt-32 pb-10">
        <div className="flex flex-col lg:flex-row items-center lg:items-end gap-12">
          
          {/* Artwork - Spotify Style */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="relative"
          >
            <div className={`absolute -inset-10 bg-accent/20 rounded-full blur-[120px] transition-all duration-1000 ${isPlaying ? 'opacity-100' : 'opacity-0'}`} />
            <div className="w-64 h-64 md:w-80 md:h-80 bg-zinc-900 border border-white/5 rounded-none overflow-hidden shadow-[0_40px_80px_-15px_rgba(0,0,0,0.9)] relative z-10">
              {radioData?.thumbnail ? (
                <img src={radioData.thumbnail} className={`w-full h-full object-cover transition-transform duration-[15s] linear infinite ${isPlaying ? 'scale-110' : 'scale-100'}`} alt="" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-950"><Disc size={100} className="text-zinc-800" /></div>
              )}
            </div>
          </motion.div>

          {/* Identity Section - Ultra Clean */}
          <div className="flex flex-col gap-6 text-center lg:text-left">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center justify-center lg:justify-start gap-2"
            >
              <Activity size={14} className="text-accent animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-accent">Live Broadcast</span>
            </motion.div>
            
            <motion.h1 
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
              className="text-6xl md:text-[110px] font-black tracking-[-0.05em] uppercase leading-[0.8] italic"
            >
              {radioData?.name}
            </motion.h1>
            
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="flex items-center justify-center lg:justify-start gap-6 text-zinc-500 text-[10px] font-bold uppercase tracking-[0.3em]"
            >
              <div className="flex items-center gap-2">
                <Users size={14} className="text-accent" />
                <span className="text-white">{viewerCount.toLocaleString()}</span>
                <span>Listeners</span>
              </div>
              <span className="w-1 h-1 bg-zinc-800 rounded-full" />
              <span>{branding.siteName}</span>
            </motion.div>
          </div>
        </div>

        {/* Player Controls - Tighter Layout */}
        <div className="mt-14 flex items-center justify-center lg:justify-start gap-10">
          <button 
            onClick={togglePlay}
            className="w-20 h-20 rounded-full bg-accent text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-accent/40 group"
          >
            {isPlaying ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" className="ml-1" />}
          </button>
          
          <button className="p-4 rounded-full bg-white/5 border border-white/5 text-zinc-400 hover:text-white transition-all shadow-lg hover:bg-white/10">
            <Share2 size={24} />
          </button>

          <div className="hidden md:flex items-center gap-4 w-56 ml-6">
            <Volume2 size={20} className="text-zinc-600" />
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

        {/* Bottom Section - Clean Slate */}
        <div className="mt-24 border-t border-white/5 pt-10">
           <p className="text-[10px] font-black uppercase tracking-[0.6em] text-zinc-800 text-center lg:text-left">Studio Stream Secured // 44.1kHz</p>
        </div>
      </main>

      <audio ref={audioRef} src={STREAM_URL} preload="none" crossOrigin="anonymous" />
    </div>
  );
}