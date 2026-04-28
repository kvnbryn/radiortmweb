"use client";

import React, { useState, useEffect, useRef } from "react";
import { VolumeX, Volume2, Star, Users, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Hls from "hls.js";

interface Channel {
  id: number;
  name: string;
  slug: string;
  description: string;
  url: string;
  viewers: number;
  category: { name: string };
  status: string;
  streamType?: string;
  isPinned?: boolean;
}

export default function Hero() {
  const router = useRouter();
  const [trendingChannel, setTrendingChannel] = useState<Channel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  
  // State Branding Dinamis (Fallback ke "Live Stream" kalau pengaturan belum di-load)
  const [settings, setSettings] = useState({ siteName: "Live Stream", logoUrl: "" });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const isYoutube = trendingChannel?.streamType === "YOUTUBE" || 
                    trendingChannel?.url?.includes("youtube.com") || 
                    trendingChannel?.url?.includes("youtu.be");

  const extractYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const formatViewers = (count: number) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
    if (count >= 1000) return (count / 1000).toFixed(1) + "K";
    return count.toString();
  };

  const fetchData = async () => {
    try {
      // Fetch data channel & settings secara paralel
      const [resTv, resSettings] = await Promise.all([
        fetch("/api/tv"),
        fetch("/api/settings")
      ]);
      
      const jsonTv = await resTv.json();
      const jsonSettings = await resSettings.json();

      if (jsonSettings.success && jsonSettings.data) {
        setSettings({ 
          siteName: jsonSettings.data.siteName || "Live Stream", 
          logoUrl: jsonSettings.data.logoUrl || "" 
        });
      }

      if (jsonTv.success) {
        const liveChannels = jsonTv.data.filter((c: Channel) => c.status === "LIVE");
        if (liveChannels.length > 0) {
          const sorted = liveChannels.sort((a: Channel, b: Channel) => {
            // Prioritaskan channel yang di-pin
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            // Jika status pin sama (keduanya pin atau keduanya tidak), urutkan berdasarkan viewers
            return b.viewers - a.viewers;
          });
          setTrendingChannel(sorted[0]);
        }
      }
    } catch (error) {
      console.error("Hero Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!trendingChannel) return;
    let identifier = localStorage.getItem("vision_viewer_id");
    if (!identifier) {
      identifier = Math.random().toString(36).substring(2, 15);
      localStorage.setItem("vision_viewer_id", identifier);
    }
    const sendHeartbeat = async () => {
      try {
        await fetch("/api/viewers/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, channelId: trendingChannel.id, channelType: "TV" })
        });
      } catch (err) {}
    };
    sendHeartbeat();
    const hbInterval = setInterval(sendHeartbeat, 30000);
    return () => clearInterval(hbInterval);
  }, [trendingChannel]);

  useEffect(() => {
    if (isYoutube || !trendingChannel?.url || !videoRef.current) return;
    const video = videoRef.current;
    if (Hls.isSupported()) {
      const hls = new Hls({ maxMaxBufferLength: 10, enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(trendingChannel.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { video.play().catch(() => {}); });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = trendingChannel.url;
      video.addEventListener("loadedmetadata", () => { video.play().catch(() => {}); });
    }
    return () => { if (hlsRef.current) hlsRef.current.destroy(); };
  }, [trendingChannel, isYoutube]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleHeroClick = () => { if (trendingChannel) router.push(`/tv/${trendingChannel.slug}`); };

  return (
    <section 
      onClick={handleHeroClick}
      className="relative h-[95vh] min-h-[650px] w-full overflow-hidden lg:h-[100vh] cursor-pointer group bg-black"
    >
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
              <Loader2 className="animate-spin text-accent" size={40} />
            </div>
          ) : trendingChannel ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }} className="h-full w-full relative overflow-hidden">
              {isYoutube ? (
                <div className="absolute inset-0 w-full h-full scale-[1.2]">
                   <iframe className="h-full w-full pointer-events-none opacity-60" src={`https://www.youtube-nocookie.com/embed/${extractYoutubeId(trendingChannel.url)}?autoplay=1&mute=1&controls=0&loop=1&playlist=${extractYoutubeId(trendingChannel.url)}&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&playsinline=1`} allow="autoplay; encrypted-media" loading="lazy"></iframe>
                </div>
              ) : (
                <video ref={videoRef} className="h-full w-full object-cover opacity-60 transition-transform duration-[2000ms] group-hover:scale-105" muted={isMuted} playsInline autoPlay loop />
              )}
            </motion.div>
          ) : (
            <div className="skeleton-box h-full w-full opacity-40" />
          )}
        </AnimatePresence>
        <div className="absolute inset-y-0 right-0 z-10 w-full lg:w-2/3 pointer-events-none opacity-40">
          <svg viewBox="0 0 1000 1000" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full object-cover" preserveAspectRatio="none">
            <motion.path initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.4 }} transition={{ duration: 2.5, ease: "easeInOut" }} d="M -100 1100 C 300 700 600 300 1100 -100" stroke="url(#hero-gradient)" strokeWidth="2" />
            <defs><linearGradient id="hero-gradient" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="white" stopOpacity="0" /><stop offset="50%" stopColor="white" stopOpacity="1" /><stop offset="100%" stopColor="white" stopOpacity="0" /></linearGradient></defs>
          </svg>
        </div>
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute inset-0 z-20 bg-gradient-to-r from-background via-background/60 to-transparent" />
      </div>

      <div className="container relative z-30 mx-auto flex h-full flex-col justify-end px-6 pt-32 pb-20 md:px-12 md:pb-28 lg:pb-32">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="max-w-2xl space-y-3 md:space-y-4">
          <div className="w-fit rounded-sm bg-accent px-2.5 py-1 text-[10px] font-black tracking-widest text-white uppercase shadow-lg md:text-[11px]">#1 Trending</div>
          <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl lg:text-6xl drop-shadow-2xl">
            {trendingChannel ? trendingChannel.name : `Sinkronisasi ${settings.siteName}...`}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-white/90 md:gap-4 md:text-sm drop-shadow-md">
            <span className="flex items-center gap-1.5 text-yellow-500"><Star size={14} className="fill-yellow-500" /> 4.9</span>
            <span>2026</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 animate-pulse rounded-full bg-accent shadow-[0_0_10px_rgba(229,9,20,0.8)]" />LIVE</span>
            <span className="flex items-center gap-1.5 text-white/80"><Users size={14} /> {trendingChannel ? formatViewers(trendingChannel.viewers) : "0"} Penonton</span>
          </div>
        </motion.div>
      </div>

      {!isYoutube && (
        <div className="absolute bottom-16 right-6 z-40 hidden lg:block md:right-12 lg:bottom-28">
          <button onClick={toggleMute} className="flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-black/20 text-white shadow-lg backdrop-blur-sm transition-all hover:border-white hover:bg-white/40 active:scale-90">
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>
      )}
    </section>
  );
}