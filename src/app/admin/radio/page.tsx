"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Mic, MicOff, Play, Square, Radio as RadioIcon, 
  Terminal, Activity, Headphones, AlertTriangle, Monitor, Music
} from "lucide-react";

export default function RadioBroadcastPage() {
  const [isOnAir, setIsOnAir] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isSystemAudioActive, setIsSystemAudioActive] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [audioLevel, setAudioLevel] = useState<number[]>(new Array(40).fill(0));
  const [error, setError] = useState("");
  const [branding, setBranding] = useState({ siteName: "SYSTEM" });

  // Audio Engine Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const systemSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  // Stream & Socket Refs
  const micStreamRef = useRef<MediaStream | null>(null);
  const systemStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
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
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      stopAll();
    };
  }, []);

  // INIT AUDIO CONTEXT
  const initAudioEngine = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
      destinationRef.current = audioContextRef.current.createMediaStreamDestination();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      // Visualizer connect to destination
      const visualizerSource = audioContextRef.current.createMediaStreamSource(destinationRef.current.stream);
      visualizerSource.connect(analyserRef.current);
      
      startVisualizerLoop();
    }
  };

  const startVisualizerLoop = () => {
    if (!analyserRef.current) return;
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
  };

  // 1. MIC CONTROL (PREVIEW)
  const toggleMic = async () => {
    if (isMicActive) {
      if (micSourceRef.current) micSourceRef.current.disconnect();
      if (micStreamRef.current) micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
      setIsMicActive(false);
    } else {
      try {
        initAudioEngine();
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: selectedDevice ? { exact: selectedDevice } : undefined }
        });
        micStreamRef.current = stream;
        micSourceRef.current = audioContextRef.current!.createMediaStreamSource(stream);
        micSourceRef.current.connect(destinationRef.current!);
        setIsMicActive(true);
      } catch (err) {
        setError("Gagal akses Microphone.");
      }
    }
  };

  // 2. SYSTEM AUDIO CONTROL
  const toggleSystemAudio = async () => {
    if (isSystemAudioActive) {
      if (systemSourceRef.current) systemSourceRef.current.disconnect();
      if (systemStreamRef.current) systemStreamRef.current.getTracks().forEach(t => t.stop());
      systemStreamRef.current = null;
      setIsSystemAudioActive(false);
    } else {
      try {
        initAudioEngine();
        // Menggunakan getDisplayMedia untuk menangkap audio sistem (Wajib centang "Share Audio")
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true, // Video harus true untuk memicu dialog, tapi kita cuma pake audionya
          audio: true
        });
        
        const audioTrack = stream.getAudioTracks()[0];
        if (!audioTrack) {
          stream.getTracks().forEach(t => t.stop());
          throw new Error("Audio sistem tidak dicentang.");
        }

        systemStreamRef.current = new MediaStream([audioTrack]);
        systemSourceRef.current = audioContextRef.current!.createMediaStreamSource(systemStreamRef.current);
        systemSourceRef.current.connect(destinationRef.current!);
        setIsSystemAudioActive(true);

        // Jika video track ada, stop aja biar gak berat
        stream.getVideoTracks().forEach(t => t.stop());
      } catch (err) {
        setError("Gagal akses Audio Sistem. Pastikan centang 'Share Audio'.");
      }
    }
  };

  // 3. ON AIR CONTROL (SOCKET)
  const startOnAir = () => {
    if (!isMicActive && !isSystemAudioActive) {
      alert("Aktifkan Mic atau Audio Sistem dulu untuk preview!");
      return;
    }

    if (!confirm("KONFIRMASI: Lempar sinyal ke publik sekarang?")) return;

    const socket = new WebSocket(`ws://141.11.25.59:3001`);
    socketRef.current = socket;

    socket.onopen = () => {
      // Kita record dari destinationRef (hasil mixing)
      const mixedStream = destinationRef.current!.stream;
      const mediaRecorder = new MediaRecorder(mixedStream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0 && socket.readyState === WebSocket.OPEN) socket.send(e.data);
      };
      mediaRecorder.start(200);
      setIsOnAir(true);
    };

    socket.onerror = () => {
      setError("Gagal terhubung ke Broadcast Bridge.");
      stopOnAir();
    };
  };

  const stopOnAir = () => {
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    if (socketRef.current) socketRef.current.close();
    setIsOnAir(false);
  };

  const stopAll = () => {
    stopOnAir();
    if (micStreamRef.current) micStreamRef.current.getTracks().forEach(t => t.stop());
    if (systemStreamRef.current) systemStreamRef.current.getTracks().forEach(t => t.stop());
  };

  return (
    <div className="space-y-6">
      {/* Console Header */}
      <div className="bg-surface p-8 border border-white/5 rounded-none border-l-4 border-l-accent flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-6">
          <div className={`h-16 w-16 flex items-center justify-center border transition-all duration-500 ${isOnAir ? 'bg-accent/10 border-accent animate-pulse shadow-[0_0_20px_rgba(229,9,20,0.2)]' : 'bg-white/5 border-white/10'}`}>
            <RadioIcon size={32} className={isOnAir ? 'text-accent' : 'text-zinc-800'} />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight leading-none italic">
              STUDIO <span className="text-accent">CONSOLE</span>
            </h1>
            <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.2em] mt-2">
               {branding.siteName.toUpperCase()} // MIXER & BROADCAST UNIT
            </p>
          </div>
        </div>

        <button 
          onClick={isOnAir ? stopOnAir : startOnAir}
          className={`h-16 px-14 font-black uppercase tracking-widest transition-all active:scale-95 ${
            isOnAir ? 'bg-accent text-white shadow-[0_0_40px_rgba(229,9,20,0.3)]' : 'bg-white/5 border border-white/10 text-zinc-500 hover:text-white'
          }`}
        >
          {isOnAir ? "STOP ON-AIR" : "GO ON-AIR"}
        </button>
      </div>

      {error && (
        <div className="bg-accent/10 border border-accent/20 p-4 text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-3 animate-pulse">
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visualizer Area */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-black border border-white/10 p-10 h-[400px] relative flex flex-col justify-end overflow-hidden group">
            <div className="absolute top-8 left-8 flex items-center gap-3">
              <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest border ${isOnAir ? 'bg-accent border-accent text-white' : 'bg-white/5 border-white/10 text-zinc-700'}`}>
                {isOnAir ? 'LIVE TRANSMISSION' : 'PREVIEW MODE'}
              </span>
              {(isMicActive || isSystemAudioActive) && (
                <span className="text-[9px] font-mono text-emerald-500 animate-pulse uppercase tracking-widest">Signal Detected</span>
              )}
            </div>

            <div className="flex items-end gap-1.5 h-48 px-4">
              {audioLevel.map((level, i) => (
                <div 
                  key={i} 
                  className={`flex-1 transition-all duration-75 ${level > 180 ? 'bg-accent' : 'bg-white/5'}`}
                  style={{ height: `${Math.max(2, (level / 255) * 100)}%`, opacity: 1 - (i * 0.015) }}
                />
              ))}
            </div>

            <div className="mt-8 border-t border-white/10 pt-5 flex justify-between font-mono text-[9px] text-zinc-700 uppercase tracking-widest italic">
              <span>MIXER_OUT_L</span>
              <span className="text-zinc-500 tracking-[0.5em]">VisionStream Master Engine</span>
              <span>MIXER_OUT_R</span>
            </div>
          </div>

          {/* Mixing Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* MIC CONTROL */}
            <div className="bg-surface border border-white/5 p-8 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mic size={18} className={isMicActive ? 'text-accent' : 'text-zinc-700'} />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-white">Mic Channel</h3>
                </div>
                <button 
                  onClick={toggleMic}
                  className={`h-10 px-6 text-[10px] font-black uppercase tracking-widest border transition-all ${
                    isMicActive ? 'bg-accent border-accent text-white' : 'bg-black border-white/10 text-zinc-600'
                  }`}
                >
                  {isMicActive ? 'MUTE MIC' : 'ACTIVATE'}
                </button>
              </div>
              <select 
                disabled={isMicActive}
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="w-full bg-black border border-white/10 p-4 text-[10px] font-mono outline-none uppercase text-zinc-500 focus:border-accent transition-all"
              >
                {devices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || 'Input Device'}</option>)}
              </select>
            </div>

            {/* SYSTEM AUDIO CONTROL */}
            <div className="bg-surface border border-white/5 p-8 flex flex-col justify-center gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Monitor size={18} className={isSystemAudioActive ? 'text-accent' : 'text-zinc-700'} />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-white">System Audio</h3>
                </div>
                <button 
                  onClick={toggleSystemAudio}
                  className={`h-10 px-6 text-[10px] font-black uppercase tracking-widest border transition-all ${
                    isSystemAudioActive ? 'bg-accent border-accent text-white' : 'bg-black border-white/10 text-zinc-600'
                  }`}
                >
                  {isSystemAudioActive ? 'STOP CAPTURE' : 'CAPTURE'}
                </button>
              </div>
              <p className="text-[9px] text-zinc-600 uppercase font-bold leading-relaxed italic">
                * Digunakan untuk memutar lagu dari YouTube/Spotify. Wajib centang "Share Audio" saat dialog muncul.
              </p>
            </div>
          </div>
        </div>

        {/* Console Log */}
        <div className="lg:col-span-4 bg-surface border border-white/5 p-8 flex flex-col shadow-2xl">
          <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-5">
            <Terminal size={18} className="text-accent" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Console Log</h3>
          </div>
          <div className="bg-black p-5 font-mono text-[9px] leading-relaxed text-zinc-600 h-64 overflow-y-auto no-scrollbar border-l border-accent">
            {`> CONSOLE READY`} <br/>
            {`> BRANDING: ${branding.siteName.toUpperCase()}`} <br/>
            {isMicActive && <span className="text-white">{`> MIC INPUT ROUTED`}</span>} <br/>
            {isSystemAudioActive && <span className="text-white">{`> SYSTEM AUDIO ROUTED`}</span>} <br/>
            {isOnAir ? <span className="text-accent animate-pulse">{`> STREAMING LIVE TO VPS...`}</span> : `> WAITING FOR OPERATOR`}
          </div>
          <div className="mt-8 flex-1 flex flex-col justify-end">
             <div className="p-6 bg-accent/5 border border-accent/10">
                <div className="flex items-center gap-2 mb-3">
                  <Activity size={14} className="text-accent" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-accent">Mixing Engine</span>
                </div>
                <p className="text-[10px] text-zinc-500 font-bold leading-tight">
                  Status: All channels are processed in real-time before transmission.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}