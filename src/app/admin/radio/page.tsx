"use client";

import React, { useState, useEffect } from "react";
import { 
  Radio, 
  Activity, 
  Users, 
  Settings, 
  Play, 
  Square, 
  Signal, 
  Globe, 
  Clock,
  Save
} from "lucide-react";

export default function RadioBroadcastPage() {
  const [isLive, setIsLive] = useState(true);
  const [listeners, setListeners] = useState(1240);
  const [bitrate, setBitrate] = useState("128 kbps");
  const [uptime, setUptime] = useState("04:22:15");

  // Simulasi fluktuasi pendengar biar keliatan "hidup"
  useEffect(() => {
    const interval = setInterval(() => {
      setListeners(prev => prev + Math.floor(Math.random() * 5) - 2);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 p-6 lg:p-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-white mb-2">
            Broadcast <span className="font-semibold text-zinc-500">Command Center</span>
          </h1>
          <p className="text-zinc-500 text-sm tracking-wide uppercase font-medium">
            VisionStream Digital Radio Infrastructure
          </p>
        </div>
        <div className="flex items-center gap-3 bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-2 rounded-full px-4">
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-zinc-700'}`} />
          <span className="text-xs font-bold uppercase tracking-widest">
            {isLive ? 'System Online' : 'System Standby'}
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Real-time Stats */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard icon={<Users size={18} />} label="Live Listeners" value={listeners.toLocaleString()} color="text-blue-400" />
            <StatCard icon={<Activity size={18} />} label="Stream Bitrate" value={bitrate} color="text-emerald-400" />
            <StatCard icon={<Clock size={18} />} label="Current Uptime" value={uptime} color="text-amber-400" />
          </div>

          {/* Visualizer Placeholder / Stream Monitor */}
          <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/5 bg-gradient-to-br from-zinc-900 to-black group">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-end gap-1 h-32">
                {[...Array(20)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-2 bg-gradient-to-t from-zinc-800 to-zinc-400 rounded-full animate-bounce" 
                    style={{ 
                      height: `${Math.random() * 100}%`,
                      animationDuration: `${0.5 + Math.random()}s`
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="absolute bottom-6 left-6 flex items-center gap-4">
              <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
                <Radio className="text-white" size={24} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Live Monitor</p>
                <p className="text-xs text-zinc-500 tracking-wider">Mount Point: /live</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Controls */}
        <div className="space-y-6">
          {/* Production Controls */}
          <div className="bg-zinc-900/30 backdrop-blur-2xl border border-white/5 rounded-3xl p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
              <Settings size={14} /> Production Control
            </h2>
            
            <div className="space-y-5">
              <div>
                <label className="text-[10px] uppercase tracking-tighter text-zinc-500 font-bold mb-2 block">Stream Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Morning Vibes with DJ Vision"
                  className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-600 transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-tighter text-zinc-500 font-bold mb-2 block">Category / Genre</label>
                <select className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none appearance-none">
                  <option>Top 40 Hits</option>
                  <option>Electronic</option>
                  <option>Talk Show</option>
                </select>
              </div>
              
              <button className="w-full mt-4 bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all active:scale-[0.98]">
                <Save size={18} />
                Update Broadcast Info
              </button>
            </div>
          </div>

          {/* Infrastructure Health */}
          <div className="bg-zinc-900/30 backdrop-blur-2xl border border-white/5 rounded-3xl p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
              <Signal size={14} /> Node Status
            </h2>
            <div className="space-y-4">
              <HealthItem label="Icecast Server" status="Healthy" />
              <HealthItem label="Database Link" status="Connected" />
              <HealthItem label="Storage Latency" status="12ms" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: any, label: string, value: string, color: string }) {
  return (
    <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-5 rounded-2xl">
      <div className="flex items-center gap-3 mb-3 text-zinc-500">
        {icon}
        <span className="text-[10px] uppercase font-bold tracking-widest">{label}</span>
      </div>
      <p className={`text-2xl font-light tracking-tight ${color}`}>{value}</p>
    </div>
  );
}

function HealthItem({ label, status }: { label: string, status: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-xs text-zinc-400">{label}</span>
      <span className="text-[10px] font-bold text-zinc-200 uppercase tracking-tighter px-2 py-1 bg-white/5 rounded">
        {status}
      </span>
    </div>
  );
}