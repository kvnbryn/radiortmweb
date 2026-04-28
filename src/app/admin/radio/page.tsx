"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Mic, MicOff, Play, Square, Radio as RadioIcon, 
  Terminal, Activity, Headphones, Settings2, BarChart3
} from "lucide-react";

export default function RadioBroadcastPage() {
  const [isOnAir, setIsOnAir] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [audioLevel, setAudioLevel] = useState<number[]>(new Array(40).fill(0));
  const [gain, setGain] = useState(80); // FIXED: Added missing gain state
  const [error, setError] = useState("");

  const audioContextRef = useRef<AudioContext | null>(null); // FIXED: Added null for TS
  const analyserRef = useRef<AnalyserNode | null>(null); // FIXED: Added null for TS
  const streamRef = useRef<MediaStream | null>(null); // FIXED: Added null for TS
  const animationRef = useRef<number | null>(null); // FIXED: Added null for TS

  // 1. Load Audio Devices & Setup Visualizer
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.enumerateDevices().then(items => {
        const audioInputs = items.filter(d => d.kind === "audioinput");
        setDevices(audioInputs);
        if (audioInputs.length > 0) setSelectedDevice(audioInputs[0].deviceId);
      });
    } else {
      setError("Browser membutuhkan koneksi HTTPS untuk fitur Siaran.");
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // 2. Logika Visualizer Suara Asli
  const startVisualizer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: selectedDevice ? { exact: selectedDevice } : undefined }
      });
      
      streamRef.current = stream;
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVisualizer = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const step = Math.floor(bufferLength / 40);
          const newLevels = [];
          for (let i = 0; i < 40; i++) {
            newLevels.push(dataArray[i * step]);
          }
          setAudioLevel(newLevels);
          animationRef.current = requestAnimationFrame(updateVisualizer);
        }
      };
      updateVisualizer();
      setIsMicActive(true);
    } catch (err) {
      setError("Gagal mengakses Microphone. Pastikan izin diberikan.");
    }
  };

  const stopVisualizer = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (animationRef.current) cancelAnimationFrame(animationRef.current!);
    setAudioLevel(new Array(40).fill(0));
    setIsMicActive(false);
  };

  const handleMicToggle = () => {
    if (isMicActive) stopVisualizer();
    else startVisualizer();
  };

  const toggleOnAir = () => {
    if (!isOnAir) {
      if (!confirm("KONFIRMASI: Mulai transmisi sinyal ke server pusat?")) return;
      setIsOnAir(true);
    } else {
      setIsOnAir(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Console Header */}
      <div className="bg-surface p-6 border border-white/5 rounded-none border-l-4 border-l-accent flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-5">
          <div className={`h-14 w-14 flex items-center justify-center border transition-all duration-500 ${isOnAir ? 'bg-accent/10 border-accent shadow-[0_0_20px_rgba(229,9,20,0.2)]' : 'bg-white/5 border-white/10'}`}>
            <RadioIcon size={28} className={isOnAir ? 'text-accent' : 'text-muted'} />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">SIARAN <span className="text-accent">CENTER</span></h1>
            <p className="text-[10px] font-mono text-muted uppercase tracking-[0.2em] mt-2">Broadcast Engine v2.0 // Node: VS-JKT-01</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="text-right mr-6 hidden lg:block border-r border-white/10 pr-6">
              <p className="text-[10px] font-mono text-muted uppercase tracking-widest mb-1">Stream Status</p>
              <p className={`text-xs font-bold uppercase tracking-tighter ${isOnAir ? 'text-accent animate-pulse' : 'text-accent/50'}`}>
                {isOnAir ? 'Transmitting Live' : 'Systems Standby'}
              </p>
           </div>
           <button 
            onClick={toggleOnAir}
            className={`h-16 px-12 font-black uppercase tracking-widest transition-all duration-500 active:scale-95 ${
              isOnAir 
              ? 'bg-accent text-white shadow-[0_0_40px_rgba(229,9,20,0.4)]' 
              : 'bg-white/5 border border-white/10 text-muted hover:text-white hover:border-white/20'
            }`}
          >
            {isOnAir ? "STOP BROADCAST" : "GO ON-AIR"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-accent/10 border border-accent/30 p-4 text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-3">
          <div className="p-1 bg-accent text-white rounded-sm text-[8px]">ALERT</div>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-black border border-white/10 p-10 h-[420px] relative flex flex-col justify-end overflow-hidden group">
            <div className="absolute top-8 left-8 flex items-center gap-4 z-10">
              <div className="flex items-center gap-2 bg-black/80 border border-white/10 px-3 py-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isOnAir ? 'bg-accent animate-pulse' : 'bg-zinc-700'}`} />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">Master Output</span>
              </div>
            </div>

            <div className="flex items-end gap-1.5 h-56 px-4">
              {audioLevel.map((level, i) => (
                <div 
                  key={i} 
                  className={`flex-1 transition-all duration-75 ${level > 200 ? 'bg-accent' : level > 100 ? 'bg-accent/60' : 'bg-white/10'}`}
                  style={{ 
                    height: `${Math.max(4, (level / 255) * 100)}%`,
                    opacity: 1 - (i * 0.015)
                  }}
                />
              ))}
            </div>

            <div className="mt-8 border-t border-white/10 pt-5 flex justify-between font-mono text-[9px] text-zinc-600 uppercase tracking-widest">
              <span>0dB Full Scale</span>
              <span className="text-zinc-400">Spectrum Monitor // Real-time Analysis</span>
              <span>Peak: -0.3dB</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface border border-white/5 p-8 group">
              <div className="flex items-center gap-3 mb-5">
                <Headphones size={18} className="text-accent" />
                <h3 className="text-xs font-black uppercase tracking-widest text-white">Audio Source Selector</h3>
              </div>
              <select 
                disabled={isOnAir}
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="w-full bg-black border border-white/10 p-4 text-[11px] font-mono focus:border-accent outline-none uppercase disabled:opacity-30 transition-all text-white"
              >
                {devices.length > 0 ? devices.map(d => (
                  <option key={d.deviceId} value={d.deviceId}>{d.label || 'Generic Input Device'}</option>
                )) : <option>Scanning Hardware...</option>}
              </select>
            </div>

            <div className="bg-surface border border-white/5 p-8 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <button 
                  onClick={handleMicToggle}
                  className={`h-16 w-16 flex items-center justify-center border transition-all duration-500 shadow-lg ${
                    isMicActive 
                    ? 'bg-accent border-accent text-white shadow-[0_0_20px_rgba(229,9,20,0.3)]' 
                    : 'bg-black border-white/10 text-muted hover:border-white/20'
                  }`}
                >
                  {isMicActive ? <Mic size={24} /> : <MicOff size={24} />}
                </button>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest leading-none mb-1 text-white">Microphone</h3>
                  <p className={`text-[9px] font-bold uppercase tracking-widest ${isMicActive ? 'text-accent' : 'text-muted'}`}>
                    {isMicActive ? 'Capturing Audio' : 'Hardware Idle'}
                  </p>
                </div>
              </div>
              <div className="w-1/3 flex flex-col gap-2">
                 <div className="flex justify-between text-[8px] font-bold text-muted uppercase">
                    <span>Gain</span>
                    <span>{gain}%</span>
                 </div>
                 <input 
                  type="range" 
                  value={gain}
                  onChange={(e) => setGain(parseInt(e.target.value))}
                  className="w-full accent-accent bg-white/10 h-1 appearance-none cursor-pointer" 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface border border-white/5 p-8 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-5">
              <Terminal size={18} className="text-accent" />
              <h3 className="text-xs font-black uppercase tracking-widest tracking-[0.2em] text-white">Console Debugger</h3>
            </div>
            
            <div className="flex-grow space-y-6">
               <div className="bg-black/60 p-5 font-mono text-[10px] leading-relaxed text-zinc-500 border-l-2 border-accent mb-6 h-48 overflow-y-auto no-scrollbar">
                  [BOOT] VISIONSTREAM ENGINE START...<br/>
                  [AUTH] HANDSHAKE VPS SUCCESSful<br/>
                  [NETW] BANDWIDTH OPTIMIZED 10GBPS<br/>
                  {isMicActive && <span className="text-white">[AUDIO] MIC STREAM INITIALIZED</span>}<br/>
                  {isOnAir ? <span className="text-accent">[LIVE] DATA PACKET TRANSMITTING...</span> : "[IDLE] STANDBY FOR OPERATOR..."}
               </div>

               <div className="space-y-4">
                  <DiagnosticItem label="Core Node" status="ONLINE" color="text-emerald-500" />
                  <DiagnosticItem label="Database" status="CONNECTED" color="text-emerald-500" />
                  <DiagnosticItem label="Latency" status="0.012s" color="text-white" />
                  <DiagnosticItem label="Uptime" status="99.99%" color="text-accent" />
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DiagnosticItem({ label, status, color }: { label: string, status: string, color: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
      <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">{label}</span>
      <span className={`text-[10px] font-mono uppercase font-black ${color}`}>{status}</span>
    </div>
  );
}