"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume2, Radio, Share2, Heart, Users, ArrowLeft, MoreHorizontal, Music2 } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function RadioPlayerPage({ params }: { params: { slug: string } }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [radioData, setRadioData] = useState<any>(null);
  const [relatedRadios, setRelatedRadios] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const STREAM_URL = "http://141.11.25.59:8000/live";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/radio?slug=${params.slug}`);
        const json = await res.json();
        if (json.success) {
          setRadioData(json.data);
          // Ambil radio lain dalam kategori yang sama
          const relatedRes = await fetch(`/api/radio?category=${json.data.categoryId}`);
          const relatedJson = await relatedRes.json();
          if (relatedJson.success) {
            setRelatedRadios(relatedJson.data.filter((r: any) => r.slug !== params.slug));
          }
        }
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
        audioRef.current.load();
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (!isLoaded) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
      <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      <p className="text-accent font-black uppercase tracking-[0.5em] animate-pulse text-xs">VisionStream Loading...</p>
    </div>
  );

  if (!radioData) return <div className="min-h-screen bg-black flex items-center justify-center text-accent">Stasiun tidak ditemukan.</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-accent selection:text-white">
      <Navbar />
      
      {/* Spotify Style Hero Header */}
      <div className="relative pt-24 pb-10 px-6 md:px-12 overflow-hidden">
        {/* Background Gradient matching the Logo color (Simulated with Logo + Blur) */}
        <div className="absolute inset-0 z-0">
          <img 
            src={radioData.logoUrl || "/placeholder-radio.jpg"} 
            className="w-full h-full object-cover opacity-30 blur-[120px] scale-150"
            alt="ambient"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-8">
          <div className="relative group">
            <div className={`absolute -inset-4 bg-accent/20 rounded-xl blur-2xl transition-all duration-700 ${isPlaying ? 'opacity-100' : 'opacity-0'}`} />
            <img 
              src={radioData.logoUrl || "/placeholder-radio.jpg"} 
              className="w-52 h-52 md:w-64 md:h-64 object-cover rounded-xl shadow-2xl border border-white/10 relative z-10"
              alt={radioData.name}
            />
          </div>
          
          <div className="flex flex-col gap-4 text-center md:text-left">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Stasiun Radio Live</span>
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-none">{radioData.name}</h1>
            <div className="flex items-center justify-center md:justify-start gap-4 text-zinc-400 text-sm font-bold">
              <span className="text-white">{radioData.category?.name || "Music"}</span>
              <span className="w-1 h-1 bg-zinc-600 rounded-full" />
              <span>{relatedRadios.length + 1} Stasiun dalam Kategori</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar - Sleek & Modern */}
      <div className="sticky top-[70px] z-30 bg-[#0a0a0a]/80 backdrop-blur-md border-y border-white/5 px-6 md:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={togglePlay}
            className="w-14 h-14 rounded-full bg-accent text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-accent/20"
          >
            {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
          </button>
          <button className="text-zinc-400 hover:text-accent transition-colors"><Heart size={24} /></button>
          <button className="text-zinc-400 hover:text-white transition-colors"><Share2 size={24} /></button>
          <button className="text-zinc-400 hover:text-white transition-colors"><MoreHorizontal size={24} /></button>
        </div>

        <div className="hidden md:flex items-center gap-4 w-48">
          <Volume2 size={20} className="text-zinc-500" />
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={volume}
            onChange={(e) => {
              setVolume(parseInt(e.target.value));
              if(audioRef.current) audioRef.current.volume = parseInt(e.target.value) / 100;
            }}
            className="flex-1 accent-accent bg-white/10 h-1 rounded-full appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* Content Section */}
      <main className="px-6 md:px-12 py-12 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left: Description & Info */}
        <div className="lg:col-span-2 space-y-12">
          <section>
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-6">Tentang Stasiun</h3>
            <p className="text-zinc-400 leading-relaxed text-lg">
              {radioData.description || "Selamat datang di kanal VisionStream Digital. Nikmati siaran berkualitas tinggi langsung dari studio pusat dengan teknologi audio termutakhir."}
            </p>
          </section>

          {/* Related/Other Radios in category */}
          <section>
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-6">Stasiun Lainnya di Kategori {radioData.category?.name}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedRadios.map((radio: any) => (
                <Link 
                  key={radio.id} 
                  href={`/radio/${radio.slug}`}
                  className="flex items-center gap-4 p-3 bg-white/5 rounded-lg border border-transparent hover:border-white/10 hover:bg-white/10 transition-all group"
                >
                  <img src={radio.logoUrl} className="w-16 h-16 rounded object-cover" alt="" />
                  <div className="flex-1">
                    <p className="font-bold text-sm uppercase truncate group-hover:text-accent transition-colors">{radio.name}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Streaming Now</p>
                  </div>
                  <Play size={16} className="text-accent opacity-0 group-hover:opacity-100 transition-all" />
                </Link>
              ))}
              {relatedRadios.length === 0 && <p className="text-xs text-zinc-600 uppercase tracking-widest italic font-bold">Tidak ada stasiun lain ditemukan.</p>}
            </div>
          </section>
        </div>

        {/* Right: Stats & Sidebar info */}
        <div className="space-y-8">
          <div className="bg-white/5 border border-white/5 p-8 rounded-2xl">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent mb-6">Broadcast Intel</h4>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-zinc-400">
                  <Users size={16} />
                  <span className="text-xs font-bold uppercase tracking-tighter">Pendengar</span>
                </div>
                <span className="font-mono text-sm">1.242</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-zinc-400">
                  <Music2 size={16} />
                  <span className="text-xs font-bold uppercase tracking-tighter">Bitrate</span>
                </div>
                <span className="font-mono text-sm">128 Kbps</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <audio ref={audioRef} src={STREAM_URL} preload="none" crossOrigin="anonymous" />
    </div>
  );
}