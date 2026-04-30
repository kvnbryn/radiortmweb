"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Play, Pause, Volume2, Share2, Users, Activity, 
  Disc, Link as LinkIcon, Twitter, Facebook, MessageCircle, Check 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";

export default function RadioPlayerPage({ params }: { params: { slug: string } }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [radioData, setRadioData] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [branding, setBranding] = useState({ siteName: "" });
  const [viewerCount, setViewerCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Share Logic State
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);

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

  // Handle klik di luar share menu untuk menutup dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setIsShareMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 3. Heartbeat Logic dengan proteksi agar tidak error 400
  useEffect(() => {
    // Jangan kirim heartbeat kalau radioData.id belum ada (mencegah error 400 Bad Request)
    if (!radioData?.id || !isPlaying) return;

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
                    channelId: radioData.id, 
                    channelType: "radio"
                })
            });
            const json = await res.json();
            // Update angka viewer di UI hanya jika berhasil
            if (json.success && json.viewers !== undefined) {
                setViewerCount(json.viewers); 
            }
        } catch (e) { 
            console.error("Heartbeat fail"); // Silent fail biar user ga keganggu
        }
    };

    // Kirim pertama kali saat play
    sendHeartbeat();

    // Kirim tiap 30 detik selama lagu diputar
    const interval = setInterval(sendHeartbeat, 30000);
    return () => clearInterval(interval);
  }, [radioData, isPlaying]);

  // 4. Logika Auto-Retry jika stream putus (Kenyamanan User)
  const handleAudioError = () => {
    if (isPlaying) {
      console.log("Stream terputus, mencoba menyambung kembali otomatis...");
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      
      // Tunggu 3 detik lalu coba play lagi secara otomatis tanpa user klik
      retryTimeoutRef.current = setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.load();
          audioRef.current.play().catch(() => {
             // Jika gagal (mungkin server benar-benar down), coba lagi nanti
             handleAudioError();
          });
        }
      }, 3000);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        // Bersihkan timeout retry jika di-pause manual
        if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      } else {
        audioRef.current.load();
        audioRef.current.play().catch(() => {
          // Jika ditekan manual tapi offline, beri toleransi auto-retry
          handleAudioError();
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Fungsi Share Profesional
  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = `Dengarkan siaran langsung ${radioData?.name || 'Radio'} di ${branding.siteName || 'sini'}!`;

    switch (platform) {
      case 'copy':
        navigator.clipboard.writeText(url);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        break;
      case 'whatsapp':
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + " " + url)}`, '_blank');
        setIsShareMenuOpen(false);
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        setIsShareMenuOpen(false);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        setIsShareMenuOpen(false);
        break;
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
          
          {/* Share Menu Wrapper */}
          <div className="relative" ref={shareMenuRef}>
            <button 
              onClick={() => setIsShareMenuOpen(!isShareMenuOpen)}
              className={`p-4 rounded-full border transition-all ${isShareMenuOpen ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-transparent text-zinc-400 hover:text-white hover:bg-white/5'}`}
            >
              <Share2 size={24} />
            </button>

            {/* Dropdown Spotify Style */}
            <AnimatePresence>
              {isShareMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-56 bg-[#282828] border border-white/5 rounded-xl p-1.5 shadow-2xl z-50 origin-bottom"
                >
                  <div className="flex flex-col">
                    <button onClick={() => handleShare('copy')} className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-white/10 transition-colors text-left group">
                      <span className="text-sm font-bold text-white group-hover:text-white">Copy Link</span>
                      {isCopied ? <Check size={18} className="text-green-500" /> : <LinkIcon size={18} className="text-zinc-400 group-hover:text-white" />}
                    </button>
                    <div className="h-[1px] bg-white/5 my-1" />
                    <button onClick={() => handleShare('whatsapp')} className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-white/10 transition-colors text-left group">
                      <MessageCircle size={18} className="text-zinc-400 group-hover:text-green-500" />
                      <span className="text-sm font-bold text-zinc-300 group-hover:text-white">WhatsApp</span>
                    </button>
                    <button onClick={() => handleShare('twitter')} className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-white/10 transition-colors text-left group">
                      <Twitter size={18} className="text-zinc-400 group-hover:text-blue-400" />
                      <span className="text-sm font-bold text-zinc-300 group-hover:text-white">X / Twitter</span>
                    </button>
                    <button onClick={() => handleShare('facebook')} className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-white/10 transition-colors text-left group">
                      <Facebook size={18} className="text-zinc-400 group-hover:text-blue-600" />
                      <span className="text-sm font-bold text-zinc-300 group-hover:text-white">Facebook</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="hidden md:flex items-center gap-4 w-52 ml-4">
            <Volume2 size={18} className="text-zinc-500" />
            <input 
              type="range" min="0" max="100" value={volume} 
              onChange={(e) => {
                const v = parseInt(e.target.value);
                setVolume(v);
                if(audioRef.current) audioRef.current.volume = v / 100;
              }}
              className="flex-1 accent-accent bg-white/5 h-1 appearance-none cursor-pointer rounded-full" 
            />
          </div>
        </div>
      </main>

      <audio 
        ref={audioRef} 
        src={STREAM_URL} 
        preload="none" 
        crossOrigin="anonymous" 
        onError={handleAudioError}
        onEnded={handleAudioError}
      />
    </div>
  );
}