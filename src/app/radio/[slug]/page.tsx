"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { Play, Pause, Volume2, VolumeX, Share2, Loader2, Headphones, Radio as RadioIcon, Activity } from "lucide-react";
import Link from "next/link";

interface RadioChannel {
  id: number;
  name: string;
  slug: string;
  description: string;
  url: string;
  bitrate: string;
  status: string;
  thumbnail: string | null;
  category: { name: string };
}

export default function RadioPlayerPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [channel, setChannel] = useState<RadioChannel | null>(null);
  const [relatedChannels, setRelatedChannels] = useState<RadioChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State Audio Player
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  // 1. Fetch Data
  useEffect(() => {
    if (!slug) return;
    const fetchData = async () => {
      try {
        const res = await fetch("/api/radio");
        const json = await res.json();
        
        if (json.success) {
          const allChannels = json.data;
          const current = allChannels.find((c: RadioChannel) => c.slug === slug);
          setChannel(current);

          const related = allChannels.filter((c: any) => c.slug !== slug && c.status === "LIVE");
          setRelatedChannels(related.slice(0, 5));
        }
      } catch (error) {
        console.error("Gagal mengambil data siaran radio", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  // 2. Audio Event Listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);
    const handleError = () => {
      setIsBuffering(false);
      setIsPlaying(false);
      console.error("Gagal memuat stream radio. Mungkin server radio sedang offline.");
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("error", handleError);

    // Otomatis mainkan saat data load
    audio.play().catch(() => console.log("Autoplay dicegah browser"));

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("error", handleError);
    };
  }, [channel]);

  // 3. Player Controls
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        // Untuk live radio, me-reload source kadang diperlukan agar tidak delay
        audioRef.current.load();
        audioRef.current.play();
      }
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="animate-spin text-green-500" size={40} />
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background text-white">
        <Headphones size={64} className="text-muted/50 mb-4" />
        <h1 className="text-2xl font-black uppercase tracking-widest text-white">Stasiun Tidak Ditemukan</h1>
        <p className="text-muted mt-2">Stasiun radio ini mungkin sudah dihapus atau slug tidak valid.</p>
        <Link href="/radio" className="mt-6 rounded-lg bg-green-600 px-6 py-2.5 font-bold hover:bg-green-700 transition">
          Eksplorasi Radio
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-green-500 selection:text-white">
      <Navbar />

      <main className="flex-grow pt-24 pb-12">
        <div className="container mx-auto px-4 md:px-8 lg:px-12">
          
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Kolom Utama: Radio Player Area */}
            <div className="flex-grow w-full lg:w-3/4 flex flex-col gap-6">
              
              {/* AUDIO ELEMENT (Hidden) */}
              <audio ref={audioRef} src={channel.url} preload="none" />

              {/* Player Card UI */}
              <div className="relative w-full rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(34,197,94,0.15)] bg-surface flex flex-col md:flex-row items-center p-6 md:p-10 gap-8 min-h-[300px]">
                
                {/* Background Blur Effect (Biar Estetik) */}
                <div 
                  className="absolute inset-0 z-0 bg-cover bg-center opacity-20 blur-3xl scale-110"
                  style={{ backgroundImage: `url('${channel.thumbnail || "/uploads/placeholder.jpg"}')` }}
                />
                <div className="absolute inset-0 z-0 bg-gradient-to-r from-background/90 to-background/50" />

                {/* Cover Art Image */}
                <div className="relative z-10 h-48 w-48 md:h-64 md:w-64 shrink-0 rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10 group">
                  {channel.thumbnail ? (
                    <img 
                      src={channel.thumbnail} 
                      alt={channel.name} 
                      className={`h-full w-full object-cover transition-transform duration-700 ${isPlaying ? 'scale-105' : 'scale-100'}`} 
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-green-900/20 text-green-500/50">
                      <RadioIcon size={64} />
                    </div>
                  )}
                  
                  {/* Overlay Muter (Spinning Circle) */}
                  {isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="h-16 w-16 rounded-full border-4 border-dashed border-green-500 animate-[spin_4s_linear_infinite]" />
                    </div>
                  )}
                </div>

                {/* Konten & Kontrol */}
                <div className="relative z-10 flex flex-col flex-grow justify-center w-full text-center md:text-left">
                  
                  {/* Badge & Kategori */}
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                    <span className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-green-500 border border-green-500/20">
                      <span className={`h-2 w-2 rounded-full bg-green-500 ${isPlaying ? 'animate-pulse' : ''}`} />
                      {channel.status === "LIVE" ? "ON AIR" : "OFF AIR"}
                    </span>
                    <span className="rounded bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white/70 border border-white/5">
                      {channel.bitrate}
                    </span>
                  </div>

                  <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight line-clamp-2">
                    {channel.name}
                  </h1>
                  <p className="text-sm text-green-400 font-bold mt-2 tracking-widest uppercase">
                    Kategori: {channel.category?.name || "Umum"}
                  </p>

                  {/* FAKE VISUALIZER (Animasi pas lagi play) */}
                  <div className="h-12 flex items-end justify-center md:justify-start gap-1.5 mt-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((bar) => (
                      <div 
                        key={bar} 
                        className={`w-1.5 bg-green-500 rounded-t-sm transition-all duration-150 ${isPlaying ? 'animate-[bounce_1s_ease-in-out_infinite]' : 'h-1 opacity-30'}`}
                        style={{ 
                          height: isPlaying ? `${Math.floor(Math.random() * 80) + 20}%` : '4px',
                          animationDelay: `${bar * 0.1}s`,
                          animationDuration: `${0.5 + (bar * 0.1)}s`
                        }}
                      />
                    ))}
                  </div>

                  {/* Control Buttons */}
                  <div className="flex items-center justify-center md:justify-start gap-4 mt-8">
                    <button 
                      onClick={togglePlay} 
                      disabled={isBuffering}
                      className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-black hover:bg-green-400 transition-all hover:scale-105 shadow-[0_0_20px_rgba(34,197,94,0.4)] disabled:opacity-50 disabled:hover:scale-100 outline-none"
                    >
                      {isBuffering ? (
                        <Loader2 size={28} className="animate-spin" />
                      ) : isPlaying ? (
                        <Pause size={28} fill="currentColor" />
                      ) : (
                        <Play size={28} fill="currentColor" className="ml-1" />
                      )}
                    </button>

                    <button 
                      onClick={toggleMute} 
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white hover:bg-white/10 transition-colors border border-white/10 outline-none"
                    >
                      {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>

                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        alert("Link radio disalin ke clipboard!");
                      }}
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white hover:bg-white/10 transition-colors border border-white/10 outline-none"
                    >
                      <Share2 size={20} />
                    </button>
                  </div>

                </div>
              </div>

              {/* Deskripsi */}
              <div className="bg-surface border border-white/5 p-6 rounded-2xl">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <Activity size={18} className="text-green-500" />
                  Tentang Stasiun Ini
                </h3>
                <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap">
                  {channel.description || "Dengarkan siaran radio online terbaik dengan kualitas audio jernih. Pantau terus stasiun ini untuk mendapatkan update dan hiburan tiada henti dari kami."}
                </p>
              </div>

            </div>

            {/* Kolom Samping: Radio Lainnya */}
            <div className="w-full lg:w-1/4 flex flex-col gap-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest border-b border-white/10 pb-2 flex items-center gap-2">
                <RadioIcon size={16} className="text-green-500" />
                Stasiun Lainnya
              </h3>
              
              <div className="flex flex-col gap-3 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                {relatedChannels.length === 0 ? (
                  <p className="text-xs text-muted font-medium italic bg-surface p-4 rounded-xl border border-white/5 text-center">Tidak ada stasiun radio lain yang On Air.</p>
                ) : (
                  relatedChannels.map((rel) => (
                    <Link href={`/radio/${rel.slug}`} key={rel.id} className="flex gap-4 cursor-pointer group bg-surface p-3 rounded-xl border border-white/5 hover:border-white/20 hover:border-l-green-500 transition-all hover:shadow-lg">
                      <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-black border border-white/10">
                        {rel.thumbnail ? (
                          <img src={rel.thumbnail} alt={rel.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-green-900/30 text-green-500/50">
                            <Headphones size={24} />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col justify-center flex-grow">
                        <h4 className="text-sm font-bold text-white line-clamp-1 group-hover:text-green-500 transition-colors">
                          {rel.name}
                        </h4>
                        <p className="text-[10px] text-muted font-medium mt-0.5 uppercase">{rel.category?.name || "Umum"}</p>
                        <div className="flex items-center gap-1 mt-1.5">
                           <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                           <span className="text-[8px] font-bold text-green-500 tracking-widest">ON AIR</span>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(34,197,94,0.5); }
      `}} />
    </div>
  );
}