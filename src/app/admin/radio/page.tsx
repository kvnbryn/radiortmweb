"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Mic, MicOff, Play, Square, Settings, Volume2, Music, Radio as RadioIcon, 
  Terminal, ShieldCheck, Cpu, Database, AlertCircle, Headphones
} from "lucide-react";

export default function RadioBroadcastPage() {
  const [isOnAir, setIsOnAir] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [gain, setGain] = useState(80);

  // Load Audio Devices
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(items => {
      const audioInputs = items.filter(d => d.kind === "audioinput");
      setDevices(audioInputs);
      if (audioInputs.length > 0) setSelectedDevice(audioInputs[0].deviceId);
    });
  }, []);

  const toggleOnAir = () => {
    if (!isOnAir) {
      if (!confirm("Konfirmasi: Mulai siaran langsung ke server utama?")) return;
    }
    setIsOnAir(!isOnAir);
  };

  return (
    <div className="space-y-6">
      {/* Status Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface p-6 border border-white/5 rounded-none border-l-4 border-l-accent">
        <div className="flex items-center gap-4">
          <div className={`h-12 w-12 rounded-none flex items-center justify-center border ${isOnAir ? 'bg-accent/10 border-accent animate-pulse' : 'bg-white/5 border-white/10'}`}>
            <RadioIcon size={24} className={isOnAir ? 'text-accent' : 'text-muted'} />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">Siaran <span className="text-accent">Center</span></h1>
            <p className="text-[10px] font-mono text-muted uppercase tracking-[0.2em] mt-1">Terminal ID: VS-RDO-0922</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="text-right mr-4 hidden lg:block">
              <p className="text-[10px] font-mono text-muted uppercase tracking-widest">Stream Engine</p>
              <p className="text-sm font-bold text-emerald-500 uppercase tracking-tighter">Balanced Node</p>
           </div>
           <button 
            onClick={toggleOnAir}
            className={`h-14 px-8 font-black uppercase tracking-widest transition-all ${
              isOnAir 
              ? 'bg-accent text-white shadow-[0_0_30px_rgba(229,9,20,0.4)] hover:bg-accent/90' 
              : 'bg-white/5 border border-white/10 text-muted hover:text-white hover:border-white/20'
            }`}
          >
            {isOnAir ? "System: Online" : "Ready to Air"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Console Area */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Signal Monitor */}
          <div className="bg-black border border-white/10 p-8 h-[350px] relative flex flex-col justify-end">
            <div className="absolute top-6 left-6 flex items-center gap-2">
              <div className="bg-accent px-3 py-1 text-[10px] font-black uppercase tracking-widest">Master Output</div>
              <div className="bg-white/5 px-3 py-1 text-[10px] font-mono uppercase tracking-widest border border-white/10">Peak: -1.2dB</div>
            </div>

            {/* Simulated VU Meter Bars */}
            <div className="flex items-end gap-1 h-48 px-10">
              {[...Array(40)].map((_, i) => (
                <div 
                  key={i} 
                  className={`flex-1 transition-all duration-75 ${isOnAir ? 'bg-accent' : 'bg-white/5'}`}
                  style={{ 
                    height: isOnAir ? `${Math.floor(Math.random() * 90) + 10}%` : '2px',
                    opacity: 1 - (i * 0.015)
                  }}
                />
              ))}
            </div>
            
            <div className="mt-8 border-t border-white/5 pt-4 flex justify-between items-center font-mono text-[10px] text-muted tracking-widest uppercase">
              <span>0Hz</span>
              <span>Input Signal Spectrum</span>
              <span>22kHz</span>
            </div>
          </div>

          {/* Device Selection & Mic Control */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface border border-white/5 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Headphones size={16} className="text-accent" />
                <h3 className="text-xs font-black uppercase tracking-widest">Audio Input Source</h3>
              </div>
              <select 
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-none p-3 text-xs font-mono focus:border-accent outline-none"
              >
                {devices.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>{device.label || `Device ${device.deviceId.slice(0,5)}`}</option>
                ))}
              </select>
            </div>

            <div className="bg-surface border border-white/5 p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsMicActive(!isMicActive)}
                  className={`h-12 w-12 flex items-center justify-center border transition-all ${isMicActive ? 'bg-accent border-accent text-white' : 'bg-black border-white/10 text-muted'}`}
                >
                  {isMicActive ? <Mic size={20} /> : <MicOff size={20} />}
                </button>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest leading-none">Mic Channel</h3>
                  <p className="text-[10px] text-muted mt-1 uppercase">{isMicActive ? 'Transmitting' : 'Muted'}</p>
                </div>
              </div>
              <div className="w-1/3">
                 <input 
                  type="range" 
                  value={gain} 
                  onChange={(e) => setGain(parseInt(e.target.value))}
                  className="w-full accent-accent bg-white/10 h-1 rounded-none appearance-none cursor-pointer" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* System Diagnostics Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface border border-white/5 p-6">
            <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
              <Terminal size={16} className="text-accent" />
              <h3 className="text-xs font-black uppercase tracking-widest tracking-widest">Console Diagnostics</h3>
            </div>
            
            <div className="space-y-4">
               <DiagnosticItem label="Core Connection" status="Stable" color="text-emerald-500" />
               <DiagnosticItem label="Icecast Auth" status="Verified" color="text-emerald-500" />
               <DiagnosticItem label="Network Latency" status="14ms" color="text-accent" />
               <DiagnosticItem label="Sync Frequency" status="44.1kHz" color="text-white" />
            </div>

            <div className="mt-8 p-4 bg-black border-l-2 border-accent font-mono text-[10px] leading-relaxed text-muted">
               {">"} INITIALIZING BROADCAST ENGINE...<br/>
               {">"} AUTHENTICATING MOUNT POINT /LIVE...<br/>
               {">"} BUFFERING 2048 SAMPLES...<br/>
               {">"} {isOnAir ? "SYSTEM BROADCASTING LIVE" : "SYSTEM READY"}
            </div>
          </div>

          <div className="bg-surface border border-white/5 p-6">
            <h3 className="text-xs font-black uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Server Integrity</h3>
            <div className="grid grid-cols-2 gap-4">
               <MiniStat icon={<Cpu size={14}/>} label="Load" value="12%" />
               <MiniStat icon={<Database size={14}/>} label="Queue" value="0.0s" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DiagnosticItem({ label, status, color }: { label: string, status: string, color: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[10px] uppercase tracking-widest text-muted font-bold">{label}</span>
      <span className={`text-[10px] font-mono uppercase font-black ${color}`}>{status}</span>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="bg-black/40 p-3 border border-white/5 flex items-center gap-3">
      <div className="text-accent">{icon}</div>
      <div>
        <p className="text-[8px] text-muted uppercase font-bold tracking-tighter">{label}</p>
        <p className="text-xs font-mono font-bold text-white">{value}</p>
      </div>
    </div>
  );
}