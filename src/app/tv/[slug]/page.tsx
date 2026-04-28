"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { 
  Play, Pause, Maximize, Minimize, Volume2, VolumeX, 
  Settings, Share2, Loader2, Radio, Users, X, Link as LinkIcon, Check 
} from "lucide-react";
import Link from "next/link";
import Hls from "hls.js";
import { motion, AnimatePresence } from "framer-motion";

interface Channel {
  id: number;
  name: string;
  slug: string;
  description: string;
  url: string;
  thumbnail?: string | null;
  status?: string;
  viewers: number;
  category: { name: string };
  streamType?: string;
}

export default function TvPlayerPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [channel, setChannel] = useState<Channel | null>(null);
  const [relatedChannels, setRelatedChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [realViewers, setRealViewers] = useState(0);
  const [settings, setSettings] = useState({ siteName: "Live Stream" });

  const playerContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [availableLevels, setAvailableLevels] = useState<{index: number, height: number}[]>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(-1);

  // State untuk Modal Share
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  const isYoutube = channel?.streamType === "YOUTUBE" || channel?.url?.includes("youtube.com") || channel?.url?.includes("youtu.be");

  // PERBAIKAN: Fungsi Regex Baru yang Super Lengkap
  const extractYoutubeId = (url: string) => {
    // Regex ini mencakup:
    // 1. youtu.be/ID
    // 2. youtube.com/watch?v=ID
    // 3. youtube.com/embed/ID
    // 4. youtube.com/v/ID
    // 5. youtube.com/live/ID
    // 6. youtube.com/shorts/ID
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  // 1. Fetch Data
  useEffect(() => {
    if (!slug) return;
    const fetchData = async () => {
      try {
        const [resTv, resSettings] = await Promise.all([
          fetch("/api/tv"),
          fetch("/api/settings")
        ]);
        
        const jsonTv = await resTv.json();
        const jsonSettings = await resSettings.json();

        if (jsonTv.success) {
          const current = jsonTv.data.find((c: Channel) => c.slug === slug);
          setChannel(current);
          setRealViewers(current.viewers);
          const related = jsonTv.data.filter((c: any) => c.slug !== slug && c.status === "LIVE");
          setRelatedChannels(related.slice(0, 5));
        }

        if (jsonSettings.success && jsonSettings.data) {
          setSettings({ siteName: jsonSettings.data.siteName || "Live Stream" });
        }
      } catch (error) {
        console.error("Gagal mengambil data siaran", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  // 2. Heartbeat Logic
  useEffect(() => {
    if (!channel) return;
    let identifier = localStorage.getItem("vision_viewer_id");
    if (!identifier) {
      identifier = Math.random().toString(36).substring(2, 15);
      localStorage.setItem("vision_viewer_id", identifier);
    }
    const sendHeartbeat = async () => {
      try {
        const res = await fetch("/api/viewers/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, channelId: channel.id, channelType: "TV" })
        });
        const data = await res.json();
        if (data.success) setRealViewers(data.viewers);
      } catch (err) {}
    };
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 30000);
    return () => clearInterval(interval);
  }, [channel]);

  // 3. Logic Player (HLS Only)
  useEffect(() => {
    if (!channel?.url || isYoutube || !videoRef.current) {
        if (isYoutube) setIsBuffering(false);
        return;
    }

    const video = videoRef.current;
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);

    if (Hls.isSupported()) {
      const hls = new Hls({ maxMaxBufferLength: 30 });
      hlsRef.current = hls; 
      hls.loadSource(channel.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        setIsBuffering(false);
        const levels = data.levels.map((level, index) => ({ index, height: level.height })).sort((a, b) => b.height - a.height);
        setAvailableLevels(levels);
        video.play().catch(() => {});
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = channel.url;
      video.addEventListener("loadedmetadata", () => {
        setIsBuffering(false);
        video.play().catch(() => {});
      });
    }

    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
    };
  }, [channel, isYoutube]);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) playerContainerRef.current.requestFullscreen().catch(() => {});
    else document.exitFullscreen();
  };

  const handleQualityChange = (levelIndex: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex;
      setCurrentLevel(levelIndex);
    }
    setShowSettings(false);
  };

  // Logic Share Sosial Media (Diupdate menjadi FB, WA, TikTok, dan X)
  const sharePlatforms = [
    {
      name: "Facebook",
      icon: (
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      color: "bg-[#1877F2]",
      action: (url: string) => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank")
    },
    {
      name: "WhatsApp",
      icon: (
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
      color: "bg-[#25D366]",
      action: (url: string) => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent("Nonton " + (channel?.name || "Siaran") + " di " + settings.siteName + ": " + url)}`, "_blank")
    },
    {
      name: "TikTok",
      icon: (
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 2.23-.9 4.46-2.43 6.08-1.53 1.62-3.71 2.58-5.96 2.62-2.25.04-4.52-.69-6.22-2.07-1.7-1.38-2.73-3.41-2.91-5.59-.18-2.18.52-4.41 1.95-6.02 1.43-1.61 3.47-2.6 5.66-2.81 2.19-.21 4.41.35 6.22 1.53.11.07.22.14.33.21v4.32c-.54-.31-1.12-.56-1.74-.71-.62-.15-1.27-.2-1.92-.15-.65.05-1.29.25-1.87.56-.58.31-1.09.73-1.49 1.25-.4.52-.68 1.13-.82 1.78-.14.65-.13 1.33.02 1.97.15.64.44 1.24.84 1.75.4.51.91.92 1.49 1.2.58.28 1.21.43 1.86.44.65.01 1.3-.11 1.91-.36.61-.25 1.17-.61 1.63-1.05.46-.44.82-1 1.05-1.6.23-.6.35-1.24.34-1.88-.01-2.91-.01-5.83-.02-8.74h-.01z"/>
        </svg>
      ),
      color: "bg-[#000000]",
      action: (url: string) => {
        // Tiktok tidak punya URL params buat nangkep konten text, jadi kita copy aja lalu buka tiktok
        navigator.clipboard.writeText(`Nonton ${(channel?.name || "Siaran")} di ${settings.siteName}: ${url}`).then(() => {
          alert("Teks & Tautan berhasil disalin! Buka TikTok untuk membagikan.");
          window.open("https://www.tiktok.com/", "_blank");
        }).catch(() => {
          window.open("https://www.tiktok.com/", "_blank");
        });
      }
    },
    {
      name: "X",
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 24.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      color: "bg-[#000000]",
      action: (url: string) => window.open(`https://x.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent("Nonton " + (channel?.name || "Siaran") + " di " + settings.siteName)}`, "_blank")
    }
  ];

  const handleCopyLink = () => {
    const url = window.location.href;
    const el = document.createElement('textarea');
    el.value = url;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-background"><Loader2 className="animate-spin text-accent" size={40} /></div>;
  if (!channel) return <div className="flex h-screen flex-col items-center justify-center bg-background text-white"><Radio size={64} className="text-muted/50 mb-4" /><h1>Siaran Tidak Ditemukan</h1></div>;

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-accent selection:text-white">
      <Navbar />

      <main className="flex-grow pt-24 pb-12">
        <div className="container mx-auto px-4 md:px-8 lg:px-12">
          <div className="flex flex-col lg:flex-row gap-8">
            
            <div className="flex-grow w-full lg:w-3/4 flex flex-col gap-4">
              
              <div 
                ref={playerContainerRef}
                className={`relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] group ${isFullscreen ? 'border-none rounded-none' : ''}`}
                onContextMenu={(e) => e.preventDefault()}
              >
                
                {isYoutube ? (
                  <div className="relative w-full h-full">
                    <iframe
                      className="w-full h-full pointer-events-auto"
                      src={`https://www.youtube-nocookie.com/embed/${extractYoutubeId(channel.url)}?autoplay=1&controls=1&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&showinfo=0`}
                      allow="autoplay; encrypted-media; fullscreen"
                      allowFullScreen
                    ></iframe>
                  </div>
                ) : (
                  <>
                    <video 
                      ref={videoRef}
                      className="h-full w-full object-contain bg-black"
                      playsInline
                      autoPlay
                      onClick={togglePlay}
                    />

                    {isBuffering && (
                      <div className="absolute inset-0 flex items-center justify-center bg-surface/80 backdrop-blur-sm z-10 pointer-events-none">
                        <div className="animate-pulse text-muted flex flex-col items-center gap-3">
                          <span className="h-12 w-12 rounded-full border-4 border-white/20 border-t-accent animate-spin" />
                          <p className="text-xs font-bold tracking-widest uppercase text-white drop-shadow-md">Menyambungkan...</p>
                        </div>
                      </div>
                    )}

                    <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col gap-2 z-20 ${showSettings ? 'opacity-100' : ''}`}>
                       <div className="w-full h-1.5 bg-white/20 rounded cursor-not-allowed overflow-hidden">
                         <div className="h-full bg-accent w-full rounded relative animate-pulse" />
                       </div>
                       
                       <div className="flex items-center justify-between text-white mt-1">
                          <div className="flex items-center gap-5">
                            <button onClick={togglePlay} className="hover:text-accent transition-colors outline-none">
                              {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
                            </button>
                            <button onClick={toggleMute} className="hover:text-accent transition-colors outline-none">
                              {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
                            </button>
                            <div className="flex items-center gap-2 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                               <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                               <span className="text-[10px] font-black tracking-widest text-accent">LIVE</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-5">
                            <div className="relative">
                              <button onClick={() => setShowSettings(!showSettings)} className="hover:text-white/70 transition-colors outline-none flex items-center gap-1">
                                <Settings size={20} className={showSettings ? "text-accent animate-spin" : ""} />
                                <span className="text-[10px] font-bold text-white/70 hidden sm:block">
                                  {currentLevel === -1 ? "Auto" : `${availableLevels.find(l => l.index === currentLevel)?.height || ''}p`}
                                </span>
                              </button>
                              {showSettings && (
                                <div className="absolute bottom-full right-0 mb-4 w-36 rounded-xl bg-surface/95 border border-white/10 p-2 shadow-2xl backdrop-blur-xl z-50">
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2 px-2 pt-1 border-b border-white/10 pb-2">Kualitas</p>
                                  <button onClick={() => handleQualityChange(-1)} className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg ${currentLevel === -1 ? "bg-accent text-white" : "hover:bg-white/10 text-white"}`}>Auto</button>
                                  {availableLevels.map(level => (
                                    <button key={level.index} onClick={() => handleQualityChange(level.index)} className={`w-full text-left px-3 py-2 mt-1 text-xs font-bold rounded-lg ${currentLevel === level.index ? "bg-accent text-white" : "hover:bg-white/10 text-white"}`}>{level.height}p</button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button onClick={toggleFullscreen} className="hover:text-white/70 transition-colors outline-none"><Maximize size={20} /></button>
                          </div>
                       </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-col gap-2 p-2 mt-2">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h1 className="text-2xl font-black text-white md:text-3xl tracking-tight">{channel.name}</h1>
                    <div className="flex items-center gap-4 mt-2">
                      <p className="text-sm text-muted">Kategori: <span className="text-accent font-bold">{channel.category?.name}</span></p>
                      <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                        <Users size={14} className="text-accent" />
                        <span className="text-xs font-bold text-white">{realViewers} Menonton</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsShareModalOpen(true)}
                    className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white/10 border border-white/10 shadow-lg"
                  >
                    <Share2 size={16} /> <span>Share</span>
                  </button>
                </div>
                <p className="text-sm text-muted mt-2 max-w-3xl leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                  {/* Bagian ini udah dirubah biar mengikuti nama website dinamis yang di atur admin */}
                  {channel.description || `Siaran langsung eksklusif dari ${settings.siteName}.`}
                </p>
              </div>
            </div>

            <div className="w-full lg:w-1/4 flex flex-col gap-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest border-b border-white/10 pb-2 flex items-center gap-2"><Radio size={16} className="text-accent" /> Sedang LIVE</h3>
              <div className="flex flex-col gap-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                {relatedChannels.map((rel) => (
                  <Link href={`/tv/${rel.slug}`} key={rel.id} className="flex gap-3 group bg-surface p-2 rounded-xl border border-white/5 hover:border-white/20 transition-all">
                    <div className="relative w-28 shrink-0 aspect-video rounded-lg overflow-hidden bg-black">
                      <div className="absolute inset-0 bg-cover bg-center opacity-70 group-hover:scale-110 transition-transform duration-500" style={{ backgroundImage: `url('${rel.thumbnail || "/uploads/placeholder.jpg"}')` }} />
                      <div className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[8px] font-bold text-accent z-10 flex items-center gap-1"><span className="h-1 w-1 bg-accent rounded-full animate-pulse" /> LIVE</div>
                    </div>
                    <div className="flex flex-col justify-center">
                      <h4 className="text-xs font-bold text-white line-clamp-2 group-hover:text-accent transition-colors">{rel.name}</h4>
                      <p className="text-[10px] text-muted">{rel.category?.name}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* MODAL SHARE PREMIUM */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm rounded-3xl border border-white/10 bg-surface p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-white uppercase tracking-widest">Share Siaran</h2>
                <button 
                  onClick={() => setIsShareModalOpen(false)}
                  className="rounded-full bg-white/5 p-2 text-muted hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Grid Sosial Media */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {sharePlatforms.map((platform) => (
                  <button
                    key={platform.name}
                    onClick={() => platform.action(window.location.href)}
                    className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/5 p-4 transition-all hover:bg-white/10 hover:-translate-y-1 group"
                  >
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${platform.color} border border-white/10 text-white shadow-lg transition-transform group-hover:scale-110`}>
                      {platform.icon}
                    </div>
                    <span className="text-xs font-bold text-white/70 group-hover:text-white uppercase tracking-wider">{platform.name}</span>
                  </button>
                ))}
              </div>

              {/* Salin Tautan Section */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Atau salin tautan</p>
                <div className="relative flex items-center gap-2 rounded-xl bg-background border border-white/10 p-1.5">
                  <div className="flex-grow overflow-hidden px-3">
                    <p className="text-xs text-muted truncate select-all">{typeof window !== 'undefined' ? window.location.href : ""}</p>
                  </div>
                  <button 
                    onClick={handleCopyLink}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                      hasCopied 
                      ? "bg-green-500 text-white" 
                      : "bg-accent text-white hover:bg-accent/90"
                    }`}
                  >
                    {hasCopied ? <Check size={14} /> : <LinkIcon size={14} />}
                    {hasCopied ? "Tersalin" : "Copy"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(229,9,20,0.5); }
      `}} />
    </div>
  );
}