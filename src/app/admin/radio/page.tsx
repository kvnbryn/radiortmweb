"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Mic, MicOff, Play, Square, Radio as RadioIcon, 
  Terminal, Activity, Headphones, AlertTriangle
} from "lucide-react";

export default function RadioBroadcastPage() {
  const [isOnAir, setIsOnAir] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [audioLevel, setAudioLevel] = useState<number[]>(new Array(40).fill(0));
  const [gain, setGain] = useState(80);
  const [error, setError] = useState("");
  const [branding, setBranding] = useState({ siteName: "" });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) setBranding({ siteName: json.data.siteName });
      });

    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.enumerateDevices().then(items => {
        const audioInputs = items.filter(d => d.kind === "audioinput");
        setDevices(audioInputs);
        if (audioInputs.length > 0) setSelectedDevice(audioInputs[0].deviceId);
      });
    } else {
      setError("HTTPS REQUIRED: Fitur ini membutuhkan koneksi aman SSL.");
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
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

      const update = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const newLevels = [];
          for (let i = 0; i < 40; i++) newLevels.push(dataArray[i * 2]);
          setAudioLevel(newLevels);
          animationRef.current = requestAnimationFrame(update);
        }
      };
      update();
      setIsMicActive(true);
    } catch (err) {
      setError("Hardware Error: Gagal mengakses perangkat audio.");
    }
  };

  const stopVisualizer = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setAudioLevel(new Array(40).fill(0));
    setIsMicActive(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface p-8 border border-white/5 rounded-none border-l-4 border-l-accent flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-6">
          <div className={`h-16 w-16 flex items-center justify-center border transition-all duration-500 ${isOnAir ? 'bg-accent/10 border-accent' : 'bg-white/5 border-white/10'}`}>
            <RadioIcon size={32} className={isOnAir ? 'text-accent' : 'text-zinc-700'} />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight leading-none">SYSTEM <span className="text-accent">CONSOLE</span></h1>
            <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.2em] mt-2">
               {branding.siteName.toUpperCase()} BROADCAST UNIT // 09-X
            </p>
          </div>
        </div>

        <button 
          onClick={() => setIsOnAir(!isOnAir)}
          className={`h-16 px-14 font-black uppercase tracking-widest transition-all ${
            isOnAir ? 'bg-accent text-white shadow-[0_0_40px_rgba(229,9,20,0.3)]' : 'bg-white/5 border border-white/10 text-zinc-500 hover:text-white'
          }`}
        >
          {isOnAir ? "TERMINATE STREAM" : "INITIALIZE AIR"}
        </button>
      </div>

      {error && (
        <div className="bg-accent/10 border border-accent/20 p-4 text-[10px] font-bold text-accent uppercase tracking-[0.2em] flex items-center gap-3">
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-black border border-white/10 p-10 h-[400px] relative flex flex-col justify-end overflow-hidden">
            <div className="absolute top-8 left-8 flex items-center gap-3">
              <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest ${isOnAir ? 'bg-accent' : 'bg-zinc-900 text-zinc-700'}`}>
                {isOnAir ? 'MASTER OUT: LIVE' : 'MASTER OUT: STANDBY'}
              </span>
            </div>

            <div className="flex items-end gap-1.5 h-48 px-4">
              {audioLevel.map((level, i) => (
                <div 
                  key={i} 
                  className={`flex-1 transition-all duration-75 ${level > 180 ? 'bg-accent' : 'bg-white/10'}`}
                  style={{ height: `${Math.max(2, (level / 255) * 100)}%` }}
                />
              ))}
            </div>

            <div className="mt-8 border-t border-white/10 pt-5 flex justify-between font-mono text-[9px] text-zinc-700 uppercase tracking-widest">
              <span>-INF DB</span>
              <span>SPECTRUM_MONITOR_ANALYSIS</span>
              <span>0.0 DB</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface border border-white/5 p-8">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-5">Hardware Input</h3>
              <select 
                disabled={isOnAir}
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="w-full bg-black border border-white/10 p-4 text-[11px] font-mono outline-none uppercase text-white"
              >
                {devices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || 'Input Device'}</option>)}
              </select>
            </div>

            <div className="bg-surface border border-white/5 p-8 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <button 
                  onClick={isMicActive ? stopVisualizer : startVisualizer}
                  className={`h-16 w-16 flex items-center justify-center border transition-all ${isMicActive ? 'bg-accent border-accent text-white' : 'bg-black border-white/10 text-zinc-700'}`}
                >
                  {isMicActive ? <Mic size={24} /> : <MicOff size={24} />}
                </button>
                <p className="text-[10px] font-black uppercase tracking-widest text-white">Mic Link</p>
              </div>
              <input type="range" value={gain} onChange={e => setGain(parseInt(e.target.value))} className="w-24 accent-accent" />
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-surface border border-white/5 p-8">
          <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-5">
            <Terminal size={18} className="text-accent" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">System Log</h3>
          </div>
          <div className="bg-black p-5 font-mono text-[9px] leading-relaxed text-zinc-600 h-64 overflow-y-auto no-scrollbar border-l border-accent">
            {`> UNIT INITIALIZED`} <br/>
            {`> CORE CONNECTION: STABLE`} <br/>
            {`> AUTH: GRANTED`} <br/>
            {isMicActive && <span className="text-white">{`> MIC INPUT ACTIVE`}</span>} <br/>
            {isOnAir && <span className="text-accent">{`> PUSHING DATA TO /LIVE...`}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}