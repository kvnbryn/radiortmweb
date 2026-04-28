"use client";

import React, { useState, useEffect } from "react";
import { 
  Mic, MicOff, Play, Square, Radio as RadioIcon, 
  Terminal, ShieldCheck, Cpu, Database, Headphones, Activity
} from "lucide-react";

export default function RadioBroadcastPage() {
  const [isOnAir, setIsOnAir] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [gain, setGain] = useState(80);
  const [error, setError] = useState("");

  useEffect(() => {
    // Perbaikan Bug: Cek apakah mediaDevices tersedia (Wajib HTTPS untuk akses ini)
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then(items => {
          const audioInputs = items.filter(d => d.kind === "audioinput");
          setDevices(audioInputs);
          if (audioInputs.length > 0) setSelectedDevice(audioInputs[0].deviceId);
        })
        .catch(err => {
          console.error("Gagal akses hardware:", err);
          setError("Akses hardware ditolak browser.");
        });
    } else {
      setError("Browser membutuhkan koneksi HTTPS untuk fitur Siaran.");
    }
  }, []);

  const toggleOnAir = () => {
    if (!isOnAir) {
      if (!confirm("KONFIRMASI: Mulai transmisi sinyal ke server pusat?")) return;
    }
    setIsOnAir(!isOnAir);
  };

  return (
    <div className="space-y-6">
      {/* Console Header */}
      <div className="bg-surface p-6 border border-white/5 rounded-none border-l-4 border-l-accent flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`h-12 w-12 flex items-center justify-center border ${isOnAir ? 'bg-accent/10 border-accent animate-pulse' : 'bg-white/5 border-white/10'}`}>
            <RadioIcon size={24} className={isOnAir ? 'text-accent' : 'text-muted'} />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tighter">SIARAN CENTER</h1>
            <p className="text-[9px] font-mono text-muted uppercase tracking-widest mt-1">Status: {isOnAir ? 'TRANSMITTING' : 'READY'}</p>
          </div>
        </div>

        <button 
          onClick={toggleOnAir}
          className={`h-14 px-10 font-black uppercase tracking-widest transition-all ${
            isOnAir 
            ? 'bg-accent text-white shadow-[0_0_30px_rgba(229,9,20,0.3)]' 
            : 'bg-white/5 border border-white/10 text-muted hover:text-white'
          }`}
        >
          {isOnAir ? "STOP BROADCAST" : "GO ON-AIR"}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 p-4 text-xs font-bold text-red-500 uppercase tracking-widest">
          ERROR: {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Signal & Visualizer */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-black border border-white/10 p-8 h-[380px] relative flex flex-col justify-end overflow-hidden">
            <div className="absolute top-6 left-6 flex items-center gap-2">
              <span className="bg-accent px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white">Main Out</span>
              <span className="text-[9px] font-mono text-muted uppercase tracking-widest">Format: 44.1kHz / 128kbps</span>
            </div>

            {/* VU Meter Bars - Industrial Style */}
            <div className="flex items-end gap-1 h-40">
              {[...Array(50)].map((_, i) => (
                <div 
                  key={i} 
                  className={`flex-1 transition-all duration-75 ${isOnAir ? 'bg-accent' : 'bg-white/5'}`}
                  style={{ 
                    height: isOnAir ? `${Math.random() * 100}%` : '2px',
                    opacity: 1 - (i * 0.01)
                  }}
                />
              ))}
            </div>

            <div className="mt-6 border-t border-white/5 pt-4 flex justify-between font-mono text-[9px] text-muted">
              <span>DB -60</span>
              <span>INPUT SPECTRUM MONITOR</span>
              <span>DB 0</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface border border-white/5 p-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
                <Headphones size={14} /> Input Audio Device
              </h3>
              <select 
                disabled={isOnAir}
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="w-full bg-black border border-white/10 p-3 text-[11px] font-mono focus:border-accent outline-none uppercase disabled:opacity-50"
              >
                {devices.length > 0 ? devices.map(d => (
                  <option key={d.deviceId} value={d.deviceId}>{d.label || 'Unknown Input'}</option>
                )) : <option>No Device Detected</option>}
              </select>
            </div>

            <div className="bg-surface border border-white/5 p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsMicActive(!isMicActive)}
                  className={`h-12 w-12 flex items-center justify-center border ${isMicActive ? 'bg-accent border-accent text-white' : 'bg-black border-white/10 text-muted'}`}
                >
                  {isMicActive ? <Mic size={20} /> : <MicOff size={20} />}
                </button>
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest leading-none">Microphone</h3>
                  <p className="text-[9px] text-muted mt-1 uppercase font-bold">{isMicActive ? 'Transmitting' : 'Muted'}</p>
                </div>
              </div>
              <input 
                type="range" 
                value={gain}
                onChange={(e) => setGain(parseInt(e.target.value))}
                className="w-24 accent-accent bg-white/10 h-1 appearance-none cursor-pointer" 
              />
            </div>
          </div>
        </div>

        {/* Console Stats */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface border border-white/5 p-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted mb-6 flex items-center gap-2">
              <Terminal size={14} /> Live Engine Log
            </h3>
            <div className="bg-black p-4 font-mono text-[9px] leading-relaxed text-muted border-l-2 border-accent">
              [SYSTEM] INITIALIZING ENGINE...<br/>
              [SERVER] CONNECTED TO NODE-01<br/>
              [BUFFER] 2048 SAMPLES STABLE<br/>
              {isOnAir ? <span className="text-accent">[LIVE] BROADCASTING TO MOUNT /LIVE</span> : "[IDLE] WAITING FOR OPERATOR"}
            </div>
            
            <div className="mt-6 space-y-3 pt-4 border-t border-white/5">
              <StatItem label="Engine Integrity" val="99.2%" />
              <StatItem label="Stream Latency" val="12ms" />
              <StatItem label="Concurrent Link" val="Online" />
            </div>
          </div>

          <div className="bg-surface border border-white/5 p-6 grid grid-cols-2 gap-4">
             <MiniBox icon={<Cpu size={14}/>} label="CPU Load" val="14%" />
             <MiniBox icon={<Database size={14}/>} label="IO Buffer" val="0.2s" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, val }: { label: string, val: string }) {
  return (
    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tighter">
      <span className="text-muted">{label}</span>
      <span className="text-white">{val}</span>
    </div>
  );
}

function MiniBox({ icon, label, val }: { icon: any, label: string, val: string }) {
  return (
    <div className="bg-black/40 p-4 border border-white/5 flex flex-col gap-2">
      <div className="text-accent">{icon}</div>
      <p className="text-[8px] text-muted font-black uppercase">{label}</p>
      <p className="text-xs font-mono font-bold">{val}</p>
    </div>
  );
}