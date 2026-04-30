"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Mic, MicOff, Play, Square, Radio as RadioIcon, 
  Terminal, Activity, Headphones, Monitor, Sliders, AudioLines, AlertTriangle
} from "lucide-react";

export default function RadioBroadcastPage() {
  const [isOnAir, setIsOnAir] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isSystemAudioActive, setIsSystemAudioActive] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [audioLevel, setAudioLevel] = useState<number[]>(new Array(40).fill(0));
  const [micVolume, setMicVolume] = useState(100);
  const [systemVolume, setSystemVolume] = useState(70);
  const [branding, setBranding] = useState({ siteName: "SYSTEM" });
  const [error, setError] = useState("");

  const audioContextRef = useRef<AudioContext | null>(null);
  const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const micGainRef = useRef<GainNode | null>(null);
  const systemGainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const systemStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const animationRef = useRef<number | null>(null);
  
  // Buffer antrian untuk Adaptive Buffering & deteksi stop manual
  const bufferQueue = useRef<Blob[]>([]);
  const isManualStopRef = useRef(false);

  useEffect(() => {
    fetch("/api/settings").then(res => res.json()).then(json => {
      if (json.success && json.data) setBranding({ siteName: json.data.siteName });
    });

    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.enumerateDevices().then(items => {
        const audioInputs = items.filter(d => d.kind === "audioinput");
        setDevices(audioInputs);
        if (audioInputs.length > 0) setSelectedDevice(audioInputs[0].deviceId);
      });
    }
  }, []);

  useEffect(() => {
    if (micGainRef.current) micGainRef.current.gain.value = micVolume / 100;
  }, [micVolume]);

  useEffect(() => {
    if (systemGainRef.current) systemGainRef.current.gain.value = systemVolume / 100;
  }, [systemVolume]);

  const initAudioEngine = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
      destinationRef.current = audioContextRef.current.createMediaStreamDestination();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      const visualSource = audioContextRef.current.createMediaStreamSource(destinationRef.current.stream);
      visualSource.connect(analyserRef.current);
      
      const updateVisualizer = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const levels = [];
          for (let i = 0; i < 40; i++) levels.push(dataArray[i * 2]);
          setAudioLevel(levels);
          animationRef.current = requestAnimationFrame(updateVisualizer);
        }
      };
      updateVisualizer();
    }
  };

  const toggleMic = async () => {
    if (isMicActive) {
      if (micStreamRef.current) micStreamRef.current.getTracks().forEach(t => t.stop());
      setIsMicActive(false);
    } else {
      try {
        initAudioEngine();
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: selectedDevice } }
        });
        micStreamRef.current = stream;
        const source = audioContextRef.current!.createMediaStreamSource(stream);
        micGainRef.current = audioContextRef.current!.createGain();
        micGainRef.current.gain.value = micVolume / 100;
        source.connect(micGainRef.current);
        micGainRef.current.connect(destinationRef.current!);
        setIsMicActive(true);
      } catch (err) { setError("Gagal akses Microphone."); }
    }
  };

  const toggleSystemAudio = async () => {
    if (isSystemAudioActive) {
      if (systemStreamRef.current) systemStreamRef.current.getTracks().forEach(t => t.stop());
      setIsSystemAudioActive(false);
    } else {
      try {
        initAudioEngine();
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        const audioTrack = stream.getAudioTracks()[0];
        if (!audioTrack) throw new Error("Audio not shared");
        systemStreamRef.current = new MediaStream([audioTrack]);
        const source = audioContextRef.current!.createMediaStreamSource(systemStreamRef.current);
        systemGainRef.current = audioContextRef.current!.createGain();
        systemGainRef.current.gain.value = systemVolume / 100;
        source.connect(systemGainRef.current);
        systemGainRef.current.connect(destinationRef.current!);
        setIsSystemAudioActive(true);
        stream.getVideoTracks().forEach(t => t.stop());
      } catch (err) { setError("Pilih 'Share Audio' saat berbagi layar!"); }
    }
  };

  const startOnAir = () => {
    if (!isMicActive && !isSystemAudioActive) return alert("Aktifkan input audio terlebih dahulu.");
    
    isManualStopRef.current = false;

    const connectWebSocket = () => {
      const socket = new WebSocket(`ws://141.11.25.59:3001`);
      socketRef.current = socket;

      socket.onopen = () => {
        setError("");
        setIsOnAir(true);
        
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
          mediaRecorderRef.current = new MediaRecorder(destinationRef.current!.stream, { mimeType: 'audio/webm;codecs=opus' });
          
          mediaRecorderRef.current.ondataavailable = (e) => {
            if (e.data.size > 0) {
              if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                if (bufferQueue.current.length > 0) {
                  bufferQueue.current.forEach(item => socketRef.current!.send(item));
                  bufferQueue.current = [];
                }
                socketRef.current.send(e.data);
              } else {
                bufferQueue.current.push(e.data);
              }
            }
          };
          mediaRecorderRef.current.start(1000);
        }
      };

      socket.onclose = () => {
        if (!isManualStopRef.current) {
          setError("Sinyal Tidak Stabil - Mencoba Hubung Kembali...");
          setTimeout(connectWebSocket, 2000);
        }
      };

      socket.onerror = () => setError("Koneksi ke server pusat gagal.");
    };

    connectWebSocket();
  };

  const stopOnAir = () => {
    isManualStopRef.current = true;
    setIsOnAir(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (socketRef.current) {
      socketRef.current.close();
    }
    
    bufferQueue.current = [];
    
    if (micStreamRef.current) micStreamRef.current.getTracks().forEach(t => t.stop());
    if (systemStreamRef.current) systemStreamRef.current.getTracks().forEach(t => t.stop());
    
    setIsMicActive(false);
    setIsSystemAudioActive(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface p-8 border border-white/5 border-l-4 border-l-accent flex items-center justify-between shadow-2xl rounded-xl">
        <div className="flex items-center gap-6">
          <div className={`h-16 w-16 flex items-center justify-center rounded-xl border transition-all duration-500 ${isOnAir ? 'bg-accent/10 border-accent animate-pulse shadow-[0_0_20px_rgba(229,9,20,0.2)]' : 'bg-white/5 border-white/10'}`}>
            <RadioIcon size={32} className={isOnAir ? 'text-accent' : 'text-zinc-500'} />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight italic">STUDIO <span className="text-accent">CONSOLE</span></h1>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">{branding.siteName.toUpperCase()} BROADCAST UNIT</p>
          </div>
        </div>
        <button 
          onClick={isOnAir ? stopOnAir : startOnAir} 
          className={`h-16 px-14 rounded-xl font-black uppercase tracking-widest transition-all duration-300 ${isOnAir ? 'bg-accent text-white shadow-[0_0_40px_rgba(229,9,20,0.4)] hover:bg-accent/90' : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'}`}
        >
          {isOnAir ? "STOP ON-AIR" : "GO ON-AIR"}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-xs font-bold text-red-500 uppercase tracking-widest flex items-center gap-3 animate-pulse">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* REVISI EXPERT: Professional Waveform Monitor */}
        <div className="col-span-12 lg:col-span-8 bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 h-[400px] relative flex flex-col justify-between overflow-hidden shadow-2xl group">
            
            {/* Ambient Background Glow */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-accent/20 rounded-full blur-[140px] transition-opacity duration-1000 pointer-events-none ${isOnAir ? 'opacity-100' : 'opacity-0'}`} />
            
            {/* Top Indicator Bar */}
            <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
              <span className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md transition-all ${isOnAir ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/5 text-zinc-500 border border-white/10'}`}>
                {isOnAir ? <><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,1)]" /> LIVE TRANSMISSION</> : <><Square size={10} /> PREVIEW MODE</>}
              </span>
              <div className="flex items-center gap-4 text-[10px] text-zinc-500 font-mono font-bold tracking-widest">
                <span>FREQ: 48kHz</span>
                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                <span className={isOnAir ? "text-accent transition-colors" : ""}>BITRATE: 192kbps</span>
              </div>
            </div>

            {/* Centered Symmetrical Waveform */}
            <div className="relative z-10 flex items-center justify-center gap-1.5 h-full px-4 w-full mt-4">
              {audioLevel.map((level, i) => {
                const heightPct = Math.max(2, (level / 255) * 100);
                const isHigh = level > 180;
                const isMedium = level > 100;
                
                return (
                  <div 
                    key={i} 
                    className={`flex-1 w-full rounded-full transition-all duration-[50ms] ease-out ${
                      isHigh ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)]' : 
                      isMedium ? 'bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.5)]' : 
                      'bg-zinc-700/40'
                    }`} 
                    style={{ 
                      height: `${heightPct}%`, 
                      opacity: isOnAir ? 1 : 0.3 + (level/255) * 0.7 
                    }} 
                  />
                );
              })}
            </div>
        </div>

        {/* Mixing Console Panel */}
        <div className="col-span-12 lg:col-span-4 space-y-6 font-mono uppercase">
          <div className="bg-surface border border-white/5 rounded-2xl p-8 flex flex-col gap-8 shadow-xl">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
               <Sliders size={18} className="text-accent" />
               <h3 className="text-sm font-black tracking-widest italic">Mixing Console</h3>
            </div>
            
            <div className="space-y-5">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isMicActive ? 'bg-accent/20 text-accent' : 'bg-white/5 text-zinc-600'}`}>
                      <Mic size={16} />
                    </div>
                    <span className="text-[11px] font-bold tracking-tighter">Vocal Channel</span>
                  </div>
                  <button onClick={toggleMic} className={`text-[10px] px-4 py-1.5 rounded-md font-bold border transition-all ${isMicActive ? 'bg-accent border-accent text-white shadow-[0_0_15px_rgba(229,9,20,0.4)]' : 'bg-transparent border-white/10 text-zinc-500 hover:text-white'}`}>
                    {isMicActive ? 'ON' : 'OFF'}
                  </button>
               </div>
               <input type="range" value={micVolume} onChange={e => setMicVolume(parseInt(e.target.value))} className="w-full accent-accent h-1.5 bg-white/10 appearance-none cursor-pointer rounded-full" />
            </div>

            <div className="space-y-5">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isSystemAudioActive ? 'bg-accent/20 text-accent' : 'bg-white/5 text-zinc-600'}`}>
                      <Monitor size={16} />
                    </div>
                    <span className="text-[11px] font-bold tracking-tighter">System Audio</span>
                  </div>
                  <button onClick={toggleSystemAudio} className={`text-[10px] px-4 py-1.5 rounded-md font-bold border transition-all ${isSystemAudioActive ? 'bg-accent border-accent text-white shadow-[0_0_15px_rgba(229,9,20,0.4)]' : 'bg-transparent border-white/10 text-zinc-500 hover:text-white'}`}>
                    {isSystemAudioActive ? 'ON' : 'OFF'}
                  </button>
               </div>
               <input type="range" value={systemVolume} onChange={e => setSystemVolume(parseInt(e.target.value))} className="w-full accent-accent h-1.5 bg-white/10 appearance-none cursor-pointer rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}