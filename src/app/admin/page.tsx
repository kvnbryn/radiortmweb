"use client";

import React, { useState, useEffect } from "react";
import { Tv, Radio, Layers, ArrowUpRight, Loader2, Activity, Database } from "lucide-react";
import { motion, Variants } from "framer-motion";
import Link from "next/link";

interface DashboardStats {
  totalTv: number;
  liveTv: number;
  totalRadio: number;
  liveRadio: number;
  totalCategories: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Data Statistik
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [tvRes, radioRes, catRes] = await Promise.all([
          fetch("/api/tv").then(res => res.json()),
          fetch("/api/radio").then(res => res.json()),
          fetch("/api/categories").then(res => res.json())
        ]);

        if (tvRes.success && radioRes.success && catRes.success) {
          const tvs = tvRes.data;
          const radios = radioRes.data;
          
          setStats({
            totalTv: tvs.length,
            liveTv: tvs.filter((t: any) => t.status === "LIVE").length,
            totalRadio: radios.length,
            liveRadio: radios.filter((r: any) => r.status === "LIVE").length,
            totalCategories: catRes.data.length
          });
        }
      } catch (error) {
        console.error("Gagal memuat statistik", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-white/20" size={32} />
      </div>
    );
  }

  // Konfigurasi animasi dengan tipe Variants eksplisit agar build tidak error
  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.4, 
        ease: "easeOut" 
      } 
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      
      {/* HEADER: Strictly Functional */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted">System Overview</span>
          </div>
          <h1 className="text-3xl font-medium tracking-tight text-white">Metrics & Status</h1>
        </div>
      </motion.div>

      {/* STATS GRID: Monochromatic with Subtle Interactions */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        
        {/* CARD: TV */}
        <Link href="/admin/tv" className="block focus:outline-none outline-none group">
          <motion.div 
            variants={item}
            className="h-full rounded-xl bg-surface/40 border border-white/5 p-6 hover:bg-surface hover:border-white/10 transition-all duration-300 relative overflow-hidden"
          >
            {/* Subtle Gradient Hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            
            <div className="flex justify-between items-start relative z-10">
              <div className="text-muted group-hover:text-white transition-colors duration-300">
                <Tv size={20} strokeWidth={1.5} />
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/5 px-2.5 py-1 text-[10px] font-medium text-muted group-hover:border-accent/20 group-hover:text-accent transition-colors duration-300">
                <Activity size={10} />
                {stats?.liveTv} Active
              </div>
            </div>
            
            <div className="mt-12 relative z-10 flex items-end justify-between">
              <div>
                <p className="text-4xl font-light text-white tracking-tight">{stats?.totalTv}</p>
                <p className="text-xs text-muted mt-1">Total TV Channels</p>
              </div>
              <div className="text-muted/30 group-hover:text-white transition-colors duration-300 -translate-x-2 group-hover:translate-x-0">
                <ArrowUpRight size={20} strokeWidth={1.5} />
              </div>
            </div>
          </motion.div>
        </Link>

        {/* CARD: RADIO */}
        <Link href="/admin/radio" className="block focus:outline-none outline-none group">
          <motion.div 
            variants={item}
            className="h-full rounded-xl bg-surface/40 border border-white/5 p-6 hover:bg-surface hover:border-white/10 transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            
            <div className="flex justify-between items-start relative z-10">
              <div className="text-muted group-hover:text-white transition-colors duration-300">
                <Radio size={20} strokeWidth={1.5} />
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/5 px-2.5 py-1 text-[10px] font-medium text-muted group-hover:border-accent/20 group-hover:text-accent transition-colors duration-300">
                <Activity size={10} />
                {stats?.liveRadio} Active
              </div>
            </div>
            
            <div className="mt-12 relative z-10 flex items-end justify-between">
              <div>
                <p className="text-4xl font-light text-white tracking-tight">{stats?.totalRadio}</p>
                <p className="text-xs text-muted mt-1">Total Radio Stations</p>
              </div>
              <div className="text-muted/30 group-hover:text-white transition-colors duration-300 -translate-x-2 group-hover:translate-x-0">
                <ArrowUpRight size={20} strokeWidth={1.5} />
              </div>
            </div>
          </motion.div>
        </Link>

        {/* CARD: CATEGORY */}
        <Link href="/admin/category" className="block focus:outline-none outline-none group">
          <motion.div 
            variants={item}
            className="h-full rounded-xl bg-surface/40 border border-white/5 p-6 hover:bg-surface hover:border-white/10 transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            
            <div className="flex justify-between items-start relative z-10">
              <div className="text-muted group-hover:text-white transition-colors duration-300">
                <Layers size={20} strokeWidth={1.5} />
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/5 px-2.5 py-1 text-[10px] font-medium text-muted">
                <Database size={10} />
                Indexed
              </div>
            </div>
            
            <div className="mt-12 relative z-10 flex items-end justify-between">
              <div>
                <p className="text-4xl font-light text-white tracking-tight">{stats?.totalCategories}</p>
                <p className="text-xs text-muted mt-1">Active Categories</p>
              </div>
              <div className="text-muted/30 group-hover:text-white transition-colors duration-300 -translate-x-2 group-hover:translate-x-0">
                <ArrowUpRight size={20} strokeWidth={1.5} />
              </div>
            </div>
          </motion.div>
        </Link>

      </motion.div>

      {/* QUICK ACTIONS: Minimalist List */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="pt-6 border-t border-white/5"
      >
        <div className="flex flex-col sm:flex-row gap-8">
          <div className="w-full sm:w-1/4">
            <h2 className="text-xs font-bold text-white uppercase tracking-widest">Quick Actions</h2>
            <p className="text-[10px] text-muted mt-1">Direct management links</p>
          </div>
          
          <div className="flex flex-wrap gap-4 flex-grow">
            <Link href="/admin/tv" className="flex items-center gap-2 text-sm text-muted hover:text-white transition-colors group">
              <span className="text-white/30 group-hover:text-accent transition-colors">+</span> Add New TV Stream
            </Link>
            <span className="text-white/10 hidden sm:block">/</span>
            <Link href="/admin/radio" className="flex items-center gap-2 text-sm text-muted hover:text-white transition-colors group">
              <span className="text-white/30 group-hover:text-accent transition-colors">+</span> Add Radio Station
            </Link>
            <span className="text-white/10 hidden sm:block">/</span>
            <Link href="/admin/category" className="flex items-center gap-2 text-sm text-muted hover:text-white transition-colors group">
              <span className="text-white/30 group-hover:text-accent transition-colors">+</span> Create Category
            </Link>
            <span className="text-white/10 hidden sm:block">/</span>
            <Link href="/admin/settings" className="flex items-center gap-2 text-sm text-muted hover:text-white transition-colors group">
              <span className="text-white/30 group-hover:text-white transition-colors">↗</span> Settings
            </Link>
          </div>
        </div>
      </motion.div>

    </div>
  );
}