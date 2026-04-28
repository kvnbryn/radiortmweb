"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Users, Flame, ChevronDown, Clock, CalendarDays } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ViewerHistory {
  id: number;
  viewerCount: number;
  createdAt: string;
}

interface StreamAnalytics {
  id: number;
  name: string;
  type: "tv" | "radio";
  status: string;
  viewers: number;
  peakViewers: number;
  resolution?: string;
  bitrate?: string;
  thumbnail: string | null;
  isPinned?: boolean;
  history: ViewerHistory[];
}

// KOMPONEN DIPINDAHKAN KE LUAR & DIDESAIN ULANG UNTUK DRAG-TO-SCROLL
const ScrollableLineChart = ({ data }: { data: ViewerHistory[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  // State untuk fitur Drag to Scroll
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 w-full items-center justify-center text-xs text-muted/50 border border-dashed border-white/10 rounded-xl bg-black/10">
        Tidak ada aktivitas penonton dalam rentang waktu filter ini.
      </div>
    );
  }

  // Downsample data agar grafik tidak terlalu padat
  let chartData = data;
  if (data.length > 200) {
    const step = Math.ceil(data.length / 200);
    chartData = data.filter((_, i) => i % step === 0);
  }

  // Kalkulasi max value lokal agar grafik berfluktuasi
  const localPeak = Math.max(...chartData.map(d => d.viewerCount));
  // Beri sedikit ruang kosong di atas grafik (margin top 10%)
  const maxVal = localPeak > 0 ? Math.ceil(localPeak * 1.1) : 10; 
  
  const points = chartData.map((d, i) => {
    const x = chartData.length > 1 ? (i / (chartData.length - 1)) * 100 : 50;
    const y = maxVal === 0 ? 100 : 100 - ((d.viewerCount / maxVal) * 100);
    return { 
      x, y, value: d.viewerCount, 
      time: new Date(d.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      date: new Date(d.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    };
  });

  const linePath = points.length > 0 ? `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}` : "";
  const minChartWidth = Math.max(800, chartData.length * 15);

  // FUNGSI UNTUK DRAG TO SCROLL
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setHoveredIndex(null);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    if (!scrollRef.current) return;
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Kecepatan geser
    scrollRef.current.scrollLeft = scrollLeft - walk;
    setHoveredIndex(null); // Sembunyikan tooltip saat digeser
  };

  return (
    <div className="w-full rounded-xl bg-black/30 p-6 border border-white/5 shadow-inner">
      
      {/* Wrapper Scroll (Drag to Scroll Area) */}
      <div 
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className={`w-full overflow-x-auto overflow-y-hidden select-none [&::-webkit-scrollbar]:hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        
        {/* Inner Chart Area (Tinggi tetap, tidak ada padding pengganggu kalkulasi Y) */}
        <div 
          className="relative h-[260px] mt-6 mb-8" 
          style={{ minWidth: `${minChartWidth}px` }}
        >
          
          {/* Garis Horizontal Background */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
            <div className="border-t border-dashed border-white/50 w-full" />
            <div className="border-t border-dashed border-white/50 w-full" />
            <div className="border-t border-dashed border-white/50 w-full" />
          </div>

          {/* SVG Garis Grafik */}
          <svg className="absolute inset-0 h-full w-full overflow-visible pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
            {/* Efek Gradient di bawah garis */}
            <defs>
              <linearGradient id="gradientRed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d={`${linePath} L 100,100 L 0,100 Z`}
              fill="url(#gradientRed)"
              className="opacity-50"
            />
            {/* Garis Utama */}
            <path
              d={linePath}
              fill="none"
              stroke="#ef4444"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* AREA DETEKSI HOVER */}
          <div className="absolute inset-0 flex z-40">
            {points.map((_, i) => (
              <div
                key={i}
                className="flex-1 h-full"
                onMouseEnter={() => !isDragging && setHoveredIndex(i)}
              />
            ))}
          </div>

          {/* KOMPONEN HOVER (TOOLTIP & DOT) */}
          {hoveredIndex !== null && points[hoveredIndex] && !isDragging && (
            <div 
              className="absolute z-50 pointer-events-none flex flex-col items-center transition-all duration-75"
              style={{ left: `${points[hoveredIndex].x}%`, top: `${points[hoveredIndex].y}%` }}
            >
              {/* Garis Vertikal Tracker menyentuh dasar chart */}
              <div className="absolute top-0 w-px bg-white/20 -z-10" style={{ height: `${100 - points[hoveredIndex].y}%`, minHeight: '50px' }} />

              {/* Dot Menyala di Titik Grafik */}
              <div className="absolute -translate-y-1/2 -translate-x-1/2 h-3.5 w-3.5 rounded-full bg-red-500 border-2 border-white shadow-[0_0_15px_#ef4444]" />

              {/* Box Tooltip (Posisinya fix pas di atas dot) */}
              <div className="absolute -translate-y-full -translate-x-1/2 bottom-3 flex flex-col items-center">
                <div className="bg-white text-black px-4 py-2 rounded-lg shadow-[0_10px_30px_rgba(239,68,68,0.3)] text-center min-w-[100px]">
                  <p className="text-sm font-black">{points[hoveredIndex].value} <span className="text-[10px] text-black/60 uppercase">Viewers</span></p>
                  <p className="text-[10px] font-bold text-black/60 mt-0.5">{points[hoveredIndex].time}</p>
                  <p className="text-[9px] font-medium text-black/40">{points[hoveredIndex].date}</p>
                </div>
                {/* Segitiga panah ke bawah */}
                <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-white" />
              </div>
            </div>
          )}

          {/* Label Waktu Statis di Bawah */}
          {points.map((p, i) => {
            if (i % Math.ceil(chartData.length / 8) === 0) {
              return (
                <div key={`label-${i}`} className="absolute -bottom-6 -ml-6 w-12 text-center text-[10px] text-muted/50 font-medium" style={{ left: `${p.x}%` }}>
                  {p.time}
                </div>
              );
            }
            return null;
          })}
          
        </div>
      </div>
    </div>
  );
};

export default function AnalyticsPage() {
  const [streams, setStreams] = useState<StreamAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [timeRange, setTimeRange] = useState("1h"); 

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 5000);
    return () => clearInterval(interval);
  }, [timeRange]); 

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`/api/analytics?range=${timeRange}&_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      const json = await res.json();
      if (json.success) setStreams(json.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStreams = streams.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-20 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-2">Laporan</h1>
          <p className="text-sm text-muted/70">Pantau data historis dan real-time.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          {/* FILTER WAKTU */}
          <div className="flex rounded-lg bg-surface/50 p-1 border border-white/10 w-full sm:w-auto shadow-inner">
            <button onClick={() => setTimeRange("1h")} className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-md transition-all ${timeRange === '1h' ? 'bg-white text-black shadow-md' : 'text-muted hover:text-white hover:bg-white/5'}`}>
              <Clock size={14} /> 1 Jam
            </button>
            <button onClick={() => setTimeRange("24h")} className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-md transition-all ${timeRange === '24h' ? 'bg-white text-black shadow-md' : 'text-muted hover:text-white hover:bg-white/5'}`}>
              <CalendarDays size={14} /> 24 Jam
            </button>
            <button onClick={() => setTimeRange("7d")} className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-md transition-all ${timeRange === '7d' ? 'bg-white text-black shadow-md' : 'text-muted hover:text-white hover:bg-white/5'}`}>
              <CalendarDays size={14} /> 7 Hari
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input 
              type="text" 
              placeholder="Cari stream..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/20 py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-muted/50 focus:border-white/30 focus:outline-none focus:bg-white/5 transition-all"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-sm text-muted/50">Memuat data secara real-time...</div>
      ) : filteredStreams.length === 0 ? (
        <div className="py-20 text-center text-sm text-muted/50">Tidak ada siaran yang ditemukan.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredStreams.map((stream) => {
            const uid = `${stream.type}-${stream.id}`;
            const isExpanded = expandedId === uid;
            const isLive = stream.status === "LIVE";
            const thumbnail = stream.thumbnail || 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop';

            return (
              <div key={uid} className={`group flex flex-col rounded-2xl bg-white/[0.02] border border-white/5 transition-all duration-300 ${isExpanded ? 'bg-surface shadow-2xl border-white/10 ring-1 ring-white/5' : 'hover:bg-white/[0.04]'}`}>
                
                <button 
                  onClick={() => setExpandedId(isExpanded ? null : uid)}
                  className="flex items-center justify-between p-4 sm:p-5 text-left w-full outline-none"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-black/50 border border-white/5 shadow-inner">
                      <img src={thumbnail} alt="" className="h-full w-full object-cover opacity-80" />
                      {isLive && (
                        <div className="absolute left-1.5 top-1.5 flex items-center gap-1.5 rounded bg-red-600 px-1.5 py-0.5 shadow-md">
                          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                          <span className="text-[9px] font-black text-white uppercase tracking-wider leading-none">Live</span>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-base font-bold text-white mb-1">{stream.name}</h3>
                      <p className="text-xs font-semibold text-muted/60 uppercase tracking-widest">
                        {stream.type === "tv" ? `TV • ${stream.resolution}` : `RADIO • ${stream.bitrate}`}
                        {stream.isPinned && " • PINNED"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 sm:gap-10 pr-2">
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1.5 text-muted mb-1">
                        <Users size={14} />
                        <span className="text-[10px] uppercase tracking-widest font-bold">Sekarang</span>
                      </div>
                      <p className={`text-2xl font-black tracking-tight leading-none transition-colors duration-500 ${isLive ? "text-white" : "text-white/30"}`}>
                        {stream.viewers}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1.5 text-muted mb-1">
                        <Flame size={14} />
                        <span className="text-[10px] uppercase tracking-widest font-bold">All Time</span>
                      </div>
                      <p className="text-2xl font-black tracking-tight leading-none text-white/50 transition-colors duration-500">
                        {stream.peakViewers}
                      </p>
                    </div>

                    <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-muted transition-transform duration-300 ${isExpanded ? "rotate-180 bg-white/10 text-white" : ""}`}>
                      <ChevronDown size={18} />
                    </div>
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="border-t border-white/5"
                    >
                      <div className="px-6 py-8">
                        <ScrollableLineChart data={stream.history} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}