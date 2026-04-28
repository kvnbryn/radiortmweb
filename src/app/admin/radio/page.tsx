"use client";

import React, { useState } from "react";
import { 
  Mic, 
  MicOff, 
  Radio, 
  Volume2, 
  Play, 
  Square, 
  Settings2, 
  Music, 
  Monitor,
  Share2,
  Activity
} from "lucide-react";

export default function RadioBroadcastPage() {
  const [isOnAir, setIsOnAir] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(true);
  const [volume, setVolume] = useState(85);

  return (
    <div className="p-8 lg:p-12">
      {/* Upper Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Radio className="text-blue-500" size={24} />
            </div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">
              Siaran <span className="text-blue-500">Center</span>
            </h1>
          </div>
          <p className="text-zinc-500 font-medium tracking-[0.2em] uppercase text-xs">
            Professional Broadcast Terminal & Stream Controller
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsOnAir(!isOnAir)}
            className={`flex items-center gap-4 px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] transition-all duration-500 ${
              isOnAir 
              ? 'bg-red-600 shadow-[0_0_50px_rgba(220,38,38,0.3)] scale-105' 
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
            }`}
          >
            {isOnAir ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
            {isOnAir ? 'Stop On-Air' : 'Go On-Air'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Live Visualizer & Waveform - The Heart of the UI */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 min-h-[400px] relative overflow-hidden group">
            <div className="absolute top-8 left-8 flex items-center gap-4 z-10">
              <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full">
                <div className={`w-2 h-2 rounded-full ${isOnAir ? 'bg-red-500 animate-pulse' : 'bg-zinc-600'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {isOnAir ? 'Signal Transmitting' : 'Idle Mode'}
                </span>
              </div>
            </div>

            {/* Waveform Visualization Placeholder */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50 group-hover:opacity-80 transition-opacity">
              <div className="flex items-center gap-1.5 w-full px-20">
                {[...Array(60)].map((_, i) => (
                  <div 
                    key={i}
                    className={`flex-1 rounded-full transition-all duration-300 ${isOnAir ? 'bg-blue-500' : 'bg-zinc-800'}`}
                    style={{ 
                      height: isOnAir ? `${20 + Math.random() * 80}%` : '4px',
                      animation: isOnAir ? `pulse 0.8s ease-in-out infinite ${i * 0.05}s` : 'none'
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="absolute bottom-8 right-8 text-right">
              <p className="text-4xl font-mono font-black text-white/20 tracking-tighter">00:42:15:09</p>
            </div>
          </div>

          {/* Quick Input Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <InputToggle icon={<Mic size={20} />} label="Vocal Mic" active={!isMicMuted} onClick={() => setIsMicMuted(!isMicMuted)} />
            <InputToggle icon={<Monitor size={20} />} label="System Audio" active={true} />
            <InputToggle icon={<Music size={20} />} label="Auto Playlist" active={false} />
            <InputToggle icon={<Share2 size={20} />} label="External Link" active={false} />
          </div>
        </div>

        {/* Console Faders & Levels */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[40px] p-8">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 mb-8 flex items-center gap-2">
              <Settings2 size={14} /> Mixing Console
            </h3>

            <div className="space-y-10">
              {/* Vertical Fader Logic */}
              <div className="flex justify-between items-center h-64 px-4">
                <Fader label="MIC" value={75} color="bg-blue-500" />
                <Fader label="MUSIC" value={60} color="bg-purple-500" />
                <Fader label="MASTER" value={volume} color="bg-white" />
              </div>

              <div className="space-y-4 pt-6 border-t border-white/5">
                <div className="flex justify-between text-[10px] font-bold text-zinc-500 tracking-widest">
                  <span>OUTPUT GAIN</span>
                  <span>+4.2 dB</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden flex gap-0.5">
                  <div className="h-full w-[70%] bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  <div className="h-full w-[10%] bg-yellow-500" />
                  <div className="h-full w-[20%] bg-zinc-700" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InputToggle({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-6 rounded-3xl border transition-all duration-500 gap-3 group ${
        active 
        ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
        : 'bg-zinc-900/20 border-white/5 text-zinc-600 hover:border-white/10'
      }`}
    >
      <span className={`${active ? 'scale-110 shadow-[0_0_20px_rgba(59,130,246,0.2)]' : ''} transition-transform`}>{icon}</span>
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}

function Fader({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="flex flex-col items-center gap-4 h-full group">
      <div className="flex-1 w-1 bg-zinc-800 rounded-full relative">
        <div 
          className={`absolute bottom-0 left-0 w-full rounded-full ${color} opacity-20`} 
          style={{ height: `${value}%` }} 
        />
        <div 
          className={`absolute bottom-[${value}%] -translate-y-1/2 left-1/2 -translate-x-1/2 w-8 h-12 rounded-lg ${color} shadow-2xl cursor-pointer border border-white/20 hover:scale-110 transition-transform`}
          style={{ bottom: `${value}%` }}
        />
      </div>
      <span className="text-[9px] font-black tracking-widest text-zinc-600 group-hover:text-zinc-400">{label}</span>
    </div>
  );
}