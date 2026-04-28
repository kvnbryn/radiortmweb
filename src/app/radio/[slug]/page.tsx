"use client";

import React, { useState, useEffect } from "react";
import { Play, Pause, Volume2, Radio, Share2, Heart, Users } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function RadioPlayerPage({ params }: { params: { slug: string } }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [radioData, setRadioData] = useState<any>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  // Stream URL dari VPS lo
  const STREAM_URL = "http://141.11.25.59:8000/live";

  useEffect(() => {
    // Fetch data radio berdasarkan slug dari API lo
    fetch(`/api/radio?slug=${params.slug}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) setRadioData(json.data);
      });
  }, [params.slug]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        // Re-load stream biar gak delay pas kelamaan pause
        audioRef.current.load();
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (!radioData) return <div className="min-h-screen bg-black flex items-center justify-center text-accent font-black animate-pulse uppercase tracking-[0.5em]">VisionStream Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-accent relative overflow-hidden">
      <Navbar />
      
      {/* Cinematic Background Blur */}
      <div className="absolute inset-0 z-0">
        <img 
          src={radioData.logoUrl || "/placeholder-radio.jpg"} 
          className="w-full h-full object-cover opacity-20 blur-[100px] scale-150"
          alt="bg"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
      </div>

      <main className="relative z-10 container mx-auto px-6 pt-32 pb-20">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* Radio Cover Art */}
          <div className="relative group">
            <div className={`absolute -inset-4 bg-accent/20 rounded-[40px] blur-2xl transition-all duration-700 ${isPlaying ? 'opacity-100 scale-110' : 'opacity-0'}`} />
            <div className="relative w-72 h-72 md:w-96 md:h-96 rounded-[40px] overflow-hidden border border-white/10 shadow-2xl">
              <img 
                src={radioData.logoUrl || "/placeholder-radio.jpg"} 
                className={`w-full h-full object-cover transition-transform duration-[5s] ${isPlaying ? 'scale-110' : 'scale-100'}`}
                alt={radioData.name}
              />
              {!isPlaying && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                   <Radio size={64} className="text-white/20 animate-pulse" />
                </div>
              )}
            </div>
          </div>

          {/* Radio Info & Controls */}
          <div className="flex-1 text-center lg:text-left space-y-8">
            <div>
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                <span className="bg-accent px-3 py-1 text-[10px] font-black uppercase tracking-widest">Live Broadcast</span>
                <div className="flex items-center gap-2 text-zinc-400 text-[10px] font-bold uppercase tracking-widest">
                  <Users size={12} /> 1.2K Listeners
                </div>
              </div>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic mb-4 leading-none">
                {radioData.name}
              </h1>
              <p className="text-xl text-zinc-400 font-medium max-w-xl leading-relaxed">
                {radioData.description || "Menyiarkan musik terbaik dan informasi terkini langsung ke telinga Anda."}
              </p>
            </div>

            {/* Visual Player Controls */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6">
              <button 
                onClick={togglePlay}
                className="w-24 h-24 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_50px_rgba(255,255,255,0.2)]"
              >
                {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-2" />}
              </button>
              
              <div className="flex flex-col gap-2 min-w-[200px]">
                <div className="flex items-center gap-3 text-zinc-500">
                  <Volume2 size={18} />
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
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-4 pt-4">
              <button className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                <Heart size={20} />
              </button>
              <button className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                <Share2 size={20} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Hidden Audio Engine */}
      <audio 
        ref={audioRef} 
        src={STREAM_URL} 
        preload="none"
        crossOrigin="anonymous"
      />

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}