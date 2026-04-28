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
    const socket = new WebSocket(`ws://141.11.25.59:3001`);
    socketRef.current = socket;
    socket.onopen = () => {
      mediaRecorderRef.current = new MediaRecorder(destinationRef.current!.stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0 && socket.readyState === WebSocket.OPEN) socket.send(e.data);
      };
      mediaRecorderRef.current.start(200);
      setIsOnAir(true);
    };
    socket.onerror = () => setError("Koneksi ke server pusat gagal.");
  };

  // FIXED: Fungsi stop yang benar-benar mematikan segalanya
  const stopOnAir = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (socketRef.current) {
      socketRef.current.close();
    }
    // Hentikan hardware tracks untuk keamanan mutlak
    if (micStreamRef.current) micStreamRef.current.getTracks().forEach(t => t.stop());
    if (systemStreamRef.current) systemStreamRef.current.getTracks().forEach(t => t.stop());
    
    setIsMicActive(false);
    setIsSystemAudioActive(false);
    setIsOnAir(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface p-8 border border-white/5 border-l-4 border-l-accent flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-6">
          <div className={`h-16 w-16 flex items-center justify-center border ${isOnAir ? 'bg-accent/10 border-accent animate-pulse' : 'bg-white/5 border-white/10'}`}>
            <RadioIcon size={32} className={isOnAir ? 'text-accent' : 'text-zinc-800'} />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight italic">STUDIO <span className="text-accent">CONSOLE</span></h1>
            <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mt-2">{branding.siteName.toUpperCase()} BROADCAST UNIT</p>
          </div>
        </div>
        <button 
          onClick={isOnAir ? stopOnAir : startOnAir} 
          className={`h-16 px-14 font-black uppercase tracking-widest transition-all ${isOnAir ? 'bg-accent text-white shadow-[0_0_40px_rgba(229,9,20,0.3)]' : 'bg-white/5 border border-white/10 text-zinc-500 hover:text-white'}`}
        >
          {isOnAir ? "STOP ON-AIR" : "GO ON-AIR"}
        </button>
      </div>

      {error && (
        <div className="bg-accent/10 border border-accent/20 p-4 text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-3 animate-pulse">
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 bg-black border border-white/10 p-10 h-[400px] relative flex flex-col justify-end overflow-hidden group">
            <div className="absolute top-8 left-8 flex items-center gap-3">
              <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest ${isOnAir ? 'bg-accent text-white' : 'bg-white/10 text-zinc-700'}`}>
                {isOnAir ? 'LIVE TRANSMISSION' : 'PREVIEW MODE'}
              </span>
            </div>
            <div className="flex items-end gap-1.5 h-48 px-4">
              {audioLevel.map((level, i) => (
                <div key={i} className={`flex-1 transition-all duration-75 ${level > 180 ? 'bg-accent' : 'bg-white/5'}`} style={{ height: `${Math.max(2, (level / 255) * 100)}%`, opacity: 1 - (i * 0.015) }} />
              ))}
            </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6 font-mono uppercase">
          <div className="bg-surface border border-white/5 p-8 flex flex-col gap-8">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
               <Sliders size={16} className="text-accent" />
               <h3 className="text-xs font-black tracking-widest italic">Mixing Console</h3>
            </div>
            
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mic size={14} className={isMicActive ? 'text-accent' : 'text-zinc-600'} />
                    <span className="text-[10px] font-bold tracking-tighter">Vocal Channel</span>
                  </div>
                  <button onClick={toggleMic} className={`text-[9px] px-3 py-1 border ${isMicActive ? 'bg-accent border-accent text-white' : 'border-white/10 text-zinc-600'}`}>
                    {isMicActive ? 'ON' : 'OFF'}
                  </button>
               </div>
               <input type="range" value={micVolume} onChange={e => setMicVolume(parseInt(e.target.value))} className="w-full accent-accent h-1 bg-white/5 appearance-none cursor-pointer" />
            </div>

            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor size={14} className={isSystemAudioActive ? 'text-accent' : 'text-zinc-600'} />
                    <span className="text-[10px] font-bold tracking-tighter">System Audio</span>
                  </div>
                  <button onClick={toggleSystemAudio} className={`text-[9px] px-3 py-1 border ${isSystemAudioActive ? 'bg-accent border-accent text-white' : 'border-white/10 text-zinc-600'}`}>
                    {isSystemAudioActive ? 'ON' : 'OFF'}
                  </button>
               </div>
               <input type="range" value={systemVolume} onChange={e => setSystemVolume(parseInt(e.target.value))} className="w-full accent-accent h-1 bg-white/5 appearance-none cursor-pointer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}