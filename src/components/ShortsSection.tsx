"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// --- Icons (SVG Murni) ---
const ChevronUpIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m18 15-6-6-6 6"/>
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12"/>
  </svg>
);

const PlayIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);

const HeartIcon = ({ solid }: { solid?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={solid ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={solid ? "text-red-500" : "text-white"}>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
  </svg>
);

// --- Types ---
type Short = {
  id: number;
  title: string;
  slug: string;
  youtubeId: string;
  thumbnail: string | null;
  views: number;
  likeCount: number;
};

export default function ShortsSection() {
  const [shorts, setShorts] = useState<Short[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State untuk mode Immersive Player
  const [selectedShortIndex, setSelectedShortIndex] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  
  const [isMounted, setIsMounted] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    
    const fetchShorts = async () => {
      try {
        // LIMIT DIKURANGI JADI 6 (Satu Baris)
        const res = await fetch('/api/shorts?limit=6');
        const json = await res.json();
        if (json.success) {
          setShorts(json.data);
        }
      } catch (err) {
        console.error("Gagal memuat shorts", err);
      } finally {
        setLoading(false);
      }
    };
    fetchShorts();
  }, []);

  // Lock body scroll saat mode player aktif agar tidak bocor scroll ke bawah
  useEffect(() => {
    if (selectedShortIndex !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [selectedShortIndex]);

  // Auto-scroll ke video yang dipilih saat mode player dibuka
  useEffect(() => {
    if (selectedShortIndex !== null && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const targetElement = container.children[selectedShortIndex] as HTMLElement;
      if (targetElement) {
        container.scrollTop = targetElement.offsetTop;
      }
    }
  }, [selectedShortIndex]);

  // Intersection Observer untuk deteksi video mana yang sedang dilihat (Active)
  useEffect(() => {
    if (selectedShortIndex === null || !scrollContainerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(Number(entry.target.getAttribute('data-id')));
          }
        });
      },
      { root: scrollContainerRef.current, threshold: 0.7 }
    );

    const items = scrollContainerRef.current.querySelectorAll('.short-item');
    items.forEach(item => observer.observe(item));

    return () => observer.disconnect();
  }, [selectedShortIndex]);

  if (loading) return (
    <div className="flex justify-center py-10">
      <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="w-full">
      {/* --- Tampilan GRID (Preview di Homepage - Maksimal 6) --- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {shorts.map((short, index) => (
          <div 
            key={short.id}
            onClick={() => setSelectedShortIndex(index)}
            className="group relative aspect-[9/16] cursor-pointer overflow-hidden rounded-xl border border-white/5 bg-surface hover:border-white/20 transition-all hover:-translate-y-1 shadow-lg"
          >
            <img 
              src={short.thumbnail || `https://img.youtube.com/vi/${short.youtubeId}/maxresdefault.jpg`} 
              alt={short.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
            <div className="absolute bottom-3 left-3 right-3 text-white">
              <p className="text-[10px] font-bold uppercase tracking-widest text-accent mb-1">Vision Short</p>
              <h4 className="text-xs font-bold line-clamp-2 leading-tight drop-shadow-md">{short.title}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* --- MODE PLAYER IMMERSIVE (Fullscreen Overlay) --- */}
      {isMounted && selectedShortIndex !== null && createPortal(
        <div 
          className="fixed inset-0 bg-background flex items-center justify-center overflow-hidden" 
          style={{ zIndex: 9999999 }} // Super high Z-Index
        >
          {/* CSS Nuclear: Paksa hilangkan Navbar/Header bawaan saat mode ini aktif */}
          <style dangerouslySetInnerHTML={{ __html: `
            header, nav, .navbar, [class*="navbar"], [class*="Header"] {
              display: none !important;
              opacity: 0 !important;
              pointer-events: none !important;
            }
          `}} />
          
          {/* Tombol Close (Pojok Atas) */}
          <button 
            onClick={() => setSelectedShortIndex(null)}
            className="absolute top-6 right-6 z-[100] p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all backdrop-blur-md border border-white/10"
          >
            <CloseIcon />
          </button>

          <div className="relative flex flex-row items-center justify-center gap-10 w-full h-full max-w-6xl">
            
            {/* Player Area */}
            <div className="relative w-full max-w-[420px] h-full md:h-[90vh] bg-black md:rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-white/10">
              <div
                ref={scrollContainerRef}
                className="h-full w-full overflow-y-scroll snap-y snap-mandatory hide-scrollbar scroll-smooth"
              >
                {shorts.map((short, index) => (
                  <div
                    key={short.id}
                    data-id={short.id}
                    className="short-item relative w-full h-full flex-shrink-0 snap-start snap-always"
                  >
                    <ShortVideoPlayer 
                      short={short} 
                      isActive={activeId === short.id} 
                      isFirstSelected={index === selectedShortIndex} 
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Navigasi Desktop (Kanan Tengah) */}
            <div className="hidden lg:flex flex-col gap-6 absolute right-10 top-1/2 -translate-y-1/2">
              <button 
                onClick={() => {
                  scrollContainerRef.current?.scrollBy({ top: -scrollContainerRef.current.clientHeight, behavior: 'smooth' });
                }}
                className="p-5 rounded-full bg-white/5 backdrop-blur-lg border border-white/10 text-white/50 hover:text-white hover:bg-white/15 transition-all shadow-xl hover:-translate-y-1 active:scale-95"
              >
                <ChevronUpIcon />
              </button>
              <button 
                onClick={() => {
                  scrollContainerRef.current?.scrollBy({ top: scrollContainerRef.current.clientHeight, behavior: 'smooth' });
                }}
                className="p-5 rounded-full bg-white/5 backdrop-blur-lg border border-white/10 text-white/50 hover:text-white hover:bg-white/15 transition-all shadow-xl hover:translate-y-1 active:scale-95"
              >
                <ChevronDownIcon />
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

// --- Komponen Player Video Individual ---
function ShortVideoPlayer({ short, isActive, isFirstSelected }: { short: Short, isActive: boolean, isFirstSelected: boolean }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showStatusIcon, setShowStatusIcon] = useState(false);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);

  // Logic Playback & Unmute
  useEffect(() => {
    if (!iframeRef.current?.contentWindow || !isIframeLoaded) return;

    const playerWindow = iframeRef.current.contentWindow;

    if (isActive) {
      playerWindow.postMessage('{"event":"command","func":"unMute","args":""}', '*');
      playerWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
      
      setTimeout(() => {
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage('{"event":"command","func":"unMute","args":""}', '*');
          iframeRef.current.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        }
      }, 300);

      setIsPlaying(true);
      setShowStatusIcon(false);
    } else {
      playerWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
      setIsPlaying(false);
    }
  }, [isActive, isIframeLoaded]);

  const togglePlayback = () => {
    if (!iframeRef.current?.contentWindow) return;

    if (isPlaying) {
      iframeRef.current.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
      setShowStatusIcon(true);
    } else {
      iframeRef.current.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
      setShowStatusIcon(false);
    }
    setIsPlaying(!isPlaying);
  };

  // GENIUS LOGIC: 
  // Jika ini video yang pertama kali diklik, biarkan parameter URL autoplay=1 supaya langsung jalan secepat kilat.
  // Selain itu, matikan autoplay URL dan gunakan lazy loading biar website nggak berat.
  const autoPlayParam = isFirstSelected ? "1" : "0";
  const loadingStrategy = isFirstSelected ? "eager" : "lazy";

  return (
    <div className="w-full h-full relative group bg-black">
      <iframe
        ref={iframeRef}
        onLoad={() => setIsIframeLoaded(true)}
        loading={loadingStrategy}
        className="absolute inset-0 w-full h-full pointer-events-none scale-[1.05]"
        src={`https://www.youtube.com/embed/${short.youtubeId}?enablejsapi=1&autoplay=${autoPlayParam}&mute=0&controls=0&rel=0&modestbranding=1&loop=1&playlist=${short.youtubeId}&playsinline=1`}
        allow="autoplay; encrypted-media"
      />

      {/* Click Area Overlay */}
      <div 
        className="absolute inset-0 z-20 cursor-pointer flex flex-col justify-between p-6 md:p-8"
        onClick={togglePlayback}
      >
        
        {/* Play Icon (Hanya Muncul saat dipause secara manual) */}
        {showStatusIcon && !isPlaying && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-80 animate-pulse drop-shadow-2xl">
            <PlayIcon />
          </div>
        )}

        {/* Info Video & Interaksi */}
        <div className="flex items-end justify-between gap-4 mt-auto">
          <div className="flex-1 text-white">
            <h3 className="font-black text-lg md:text-xl line-clamp-2 leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              {short.title}
            </h3>
            <div className="flex items-center gap-3 mt-3">
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold shadow-lg">VS</div>
              <p className="text-white/80 text-xs font-bold tracking-wide uppercase drop-shadow-md">VisionStream</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-5">
            <button className="flex flex-col items-center gap-1.5 group/like" onClick={(e) => e.stopPropagation()}>
              <div className="p-3.5 bg-black/40 backdrop-blur-xl rounded-full border border-white/20 group-hover/like:bg-red-500/20 group-hover/like:border-red-500/50 transition-all duration-300 shadow-xl">
                <HeartIcon />
              </div>
              <span className="text-[11px] font-bold text-white drop-shadow-md">
                {short.likeCount.toLocaleString('id-ID')}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-10" />
    </div>
  );
}