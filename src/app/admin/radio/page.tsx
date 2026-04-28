"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Mic, MicOff, Play, Square, Radio as RadioIcon, 
  Terminal, Activity, Headphones, Settings2, BarChart3, AlertTriangle
} from "lucide-react";

export default function RadioBroadcastPage() {
  const [isOnAir, setIsOnAir] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [audioLevel, setAudioLevel] = useState<number[]>(new Array(40).fill(0));
  const [gain, setGain] = useState(80);
  const [error, setError] = useState("");
  const [branding, setBranding] = useState({ siteName: "VisionStream" });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    // Load Branding
    fetch("/api/settings")
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) setBranding({ siteName: json.data.siteName });
      });

    // Load Audio Devices
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.enumerateDevices().then(items => {
        const audioInputs = items.filter(d => d.kind === "audioinput");
        setDevices(audioInputs);
        if (audioInputs.length > 0) setSelectedDevice(audioInputs[0].deviceId);
      });
    } else {
      setError("HTTPS REQUIRED: Browser memblokir akses hardware pada koneksi tidak aman.");
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

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
      setError("ACCESS DENIED: Gagal mengakses perangkat audio.");
    }
  };

  const stopVisualizer = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    if (animationRef.current) cancelAnimationFrame(animationRef.current!);
    setAudioLevel(new Array(40).fill(0));
    setIsMicActive(false);
  };

  const handleMicToggle = () => {
    if (isMicActive) stopVisualizer();
    else startVisualizer();
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface p-6 border border-white/5 rounded-none border-l-4 border-l-accent flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center gap-5">
          <div className={`h-14 w-14 flex items-center justify-center border transition-all duration-500 ${isOnAir ? 'bg-accent/10 border-accent shadow-[0_0_20px_rgba(229,9,20,0.2)]' : 'bg-white/5 border-white/10'}`}>
            <RadioIcon size={28} className={isOnAir ? 'text-accent' : 'text-muted'} />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">
              SIARAN <span className="text-accent">CENTER</span>
            </h1>
            <p className="text-[9px] font-mono text-muted uppercase tracking-[0.2em] mt-2">
              {branding.siteName} Infrastructure // Core-Node JKT
            </p>
          </div>
        </div>

        <button 
          onClick={() => setIsOnAir(!isOnAir)}
          className={`h-16 px-12 font-black uppercase tracking-widest transition-all duration-500 active:scale-95 ${
            isOnAir 
            ? 'bg-accent text-white shadow-[0_0_40px_rgba(229,9,20,0.4)]' 
            : 'bg-white/5 border border-white/10 text-muted hover:text-white'
          }`}
        >
          {isOnAir ? "STOP BROADCAST" : "GO ON-AIR"}
        </button>
      </div>

      {error && (
        <div className="bg-accent/10 border border-accent/30 p-4 text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-3">
          <AlertTriangle size={14} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-black border border-white/10 p-10 h-[420px] relative flex flex-col justify-end overflow-hidden group">
            <div className="absolute top-8 left-8 flex items-center gap-4 z-10 font-mono text-[9px] uppercase tracking-widest">
              <span className={`px-2 py-1 ${isOnAir ? 'bg-accent text-white' : 'bg-white/10 text-muted'}`}>
                {isOnAir ? 'LIVE TRANSMISSION' : 'SIGNAL IDLE'}
              </span>
            </div>

            <div className="flex items-end gap-1.5 h-64 px-4">
              {audioLevel.map((level, i) => (
                <div 
                  key={i} 
                  className={`flex-1 transition-all duration-75 ${level > 150 ? 'bg-accent' : 'bg-white/20'}`}
                  style={{ 
                    height: `${Math.max(2, (level / 255) * 100)}%`,
                    opacity: 1 - (i * 0.01)
                  }}
                />
              ))}
            </div>

            <div className="mt-8 border-t border-white/10 pt-5 flex justify-between font-mono text-[9px] text-zinc-600 uppercase tracking-widest">
              <span>Peak Monitor</span>
              <span className="text-zinc-500 tracking-[0.3em]">Master Console</span>
              <span>-0.0 dBFS</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface border border-white/5 p-8">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white mb-4">Input Selection</h3>
              <select 
                disabled={isOnAir}
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="w-full bg-black border border-white/10 p-4 text-[11px] font-mono focus:border-accent outline-none uppercase text-white"
              >
                {devices.length > 0 ? devices.map(d => (
                  <option key={d.deviceId} value={d.deviceId}>{d.label || 'System Input'}</option>
                )) : <option>No hardware detected</option>}
              </select>
            </div>

            <div className="bg-surface border border-white/5 p-8 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <button 
                  onClick={handleMicToggle}
                  className={`h-16 w-16 flex items-center justify-center border transition-all duration-500 ${
                    isMicActive ? 'bg-accent border-accent text-white' : 'bg-black border-white/10 text-muted'
                  }`}
                >
                  {isMicActive ? <Mic size={24} /> : <MicOff size={24} />}
                </button>
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-white leading-none">Mic Link</h3>
                  <p className="text-[9px] font-bold text-muted mt-2 uppercase">{isMicActive ? 'ACTIVE' : 'READY'}</p>
                </div>
              </div>
              <input 
                type="range" 
                value={gain}
                onChange={(e) => setGain(parseInt(e.target.value))}
                className="w-24 accent-accent" 
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-surface border border-white/5 p-8">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white mb-8 border-b border-white/10 pb-5">System Log</h3>
          <div className="bg-black p-5 font-mono text-[9px] leading-relaxed text-zinc-500 h-64 overflow-y-auto no-scrollbar border-l border-accent">
            {`> SYSTEM BOOT SUCCESS`} <br/>
            {`> ${branding.siteName.toUpperCase()} CORE READY`} <br/>
            {`> AUTHENTICATING OPERATOR...`} <br/>
            {`> ANALYZING HARDWARE...`} <br/>
            {isMicActive && <span className="text-white">{`> MIC INPUT CAPTURED`}</span>} <br/>
            {isOnAir && <span className="text-accent">{`> TRANSMITTING TO /LIVE...`}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function DiagnosticItem({ label, status, color }: { label: string, status: string, color: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0 font-mono text-[9px] uppercase tracking-widest">
      <span className="text-muted font-bold">{label}</span>
      <span className={`font-black ${color}`}>{status}</span>
    </div>
  );
}