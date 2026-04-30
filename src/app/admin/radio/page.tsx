"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Mic, MicOff, Square, Radio as RadioIcon, 
  Monitor, Sliders, AlertTriangle
} from "lucide-react";

export default function RadioBroadcastPage() {
  const [isOnAir, setIsOnAir] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isSystemAudioActive, setIsSystemAudioActive] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState("");
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Reference mutable untuk state yang dibaca di dalam loop Canvas RAF (RequestAnimationFrame)
  const isOnAirRef = useRef(isOnAir);
  
  const bufferQueue = useRef<Blob[]>([]);
  const isManualStopRef = useRef(false);

  useEffect(() => {
    isOnAirRef.current = isOnAir;
  }, [isOnAir]);

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

    // Handle resize canvas agar selalu tajam
    const handleResize = () => {
        if (canvasRef.current) {
            const parent = canvasRef.current.parentElement;
            if (parent) {
                canvasRef.current.width = parent.clientWidth;
                canvasRef.current.height = parent.clientHeight;
            }
        }
    };
    window.addEventListener('resize', handleResize);
    return () => {
        window.removeEventListener('resize', handleResize);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  useEffect(() => {
    if (micGainRef.current) micGainRef.current.gain.value = micVolume / 100;
  }, [micVolume]);

  useEffect(() => {
    if (systemGainRef.current) systemGainRef.current.gain.value = systemVolume / 100;
  }, [systemVolume]);

  const initAudioEngine = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate: 48000 });
      destinationRef.current = audioContextRef.current.createMediaStreamDestination();
      
      // Setup Analyser level Expert
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 1024; // Resolusi tinggi
      analyserRef.current.smoothingTimeConstant = 0.88; // Cinematic smoothness
      
      const visualSource = audioContextRef.current.createMediaStreamSource(destinationRef.current.stream);
      visualSource.connect(analyserRef.current);
      
      // Set initial canvas size
      if (canvasRef.current && canvasRef.current.parentElement) {
          canvasRef.current.width = canvasRef.current.parentElement.clientWidth;
          canvasRef.current.height = canvasRef.current.parentElement.clientHeight;
      }
      
      const drawVisualizer = () => {
        if (!canvasRef.current || !analyserRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        analyserRef.current.getByteFrequencyData(dataArray);

        // Hapus frame sebelumnya dengan efek fading tipis untuk motion blur ringan
        ctx.fillStyle = 'rgba(10, 10, 10, 0.4)';
        ctx.fillRect(0, 0, width, height);

        const barCount = 80; // Jumlah bar lebih padat
        const barWidth = (width / barCount) - 3; // Gap 3px
        const centerY = height / 2;

        for (let i = 0; i < barCount; i++) {
            // Logarithmic mapping agar frekuensi intonasi (vokal) tertangkap presisi
            const mathPow = Math.pow(bufferLength / 2, i / barCount);
            const dataIndex = Math.floor(mathPow) || 1;
            
            // High-frequency boost (karena energi nada tinggi secara alami lebih kecil)
            const boost = 1 + (i / barCount) * 0.8;
            let value = dataArray[dataIndex] * boost;
            if (value > 255) value = 255;

            // Normalisasi amplitude ke persen
            const percent = value / 255;
            const barHeight = Math.max(4, height * percent * 0.7);

            // Perhitungan warna dynamic glow
            const onAir = isOnAirRef.current;
            const hue = onAir ? 0 : 220; // 0 = Merah (On Air), 220 = Biru/Abu (Standby)
            const saturation = onAir ? 100 : 20;
            const lightness = 30 + (percent * 40); // Makin kenceng suara makin terang
            const alpha = 0.4 + (percent * 0.6);

            ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
            
            // Efek Cinematic Glow Hand-crafted di Canvas
            ctx.shadowBlur = onAir ? 15 + (percent * 15) : 5;
            ctx.shadowColor = `hsla(${hue}, ${saturation}%, ${lightness}%, ${percent})`;

            // Menggambar pill simetris (Rounded Rectangle)
            ctx.beginPath();
            const xPos = i * (barWidth + 3) + 1.5;
            const yPos = centerY - (barHeight / 2);
            ctx.roundRect(xPos, yPos, barWidth, barHeight, barWidth / 2);
            ctx.fill();
        }
        
        animationRef.current = requestAnimationFrame(drawVisualizer);
      };
      drawVisualizer();
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
      {/* Top Header Panel - Glassmorphism touch */}
      <div className="bg-white/5 backdrop-blur-xl p-8 border border-white/10 border-l-4 border-l-accent flex items-center justify-between shadow-2xl rounded-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent pointer-events-none" />
        <div className="flex items-center gap-6 relative z-10">
          <div className={`h-16 w-16 flex items-center justify-center rounded-2xl border transition-all duration-700 ${isOnAir ? 'bg-red-500/10 border-red-500/50 animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.3)]' : 'bg-black/40 border-white/10 shadow-inner'}`}>
            <RadioIcon size={32} className={isOnAir ? 'text-red-500' : 'text-zinc-500'} />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight italic">STUDIO <span className="text-accent">CONSOLE</span></h1>
            <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mt-1 opacity-80">{branding.siteName.toUpperCase()} BROADCAST UNIT</p>
          </div>
        </div>
        <button 
          onClick={isOnAir ? stopOnAir : startOnAir} 
          className={`relative z-10 h-16 px-14 rounded-2xl font-black uppercase tracking-[0.2em] transition-all duration-500 ${isOnAir ? 'bg-red-600 text-white shadow-[0_0_40px_rgba(220,38,38,0.5)] hover:bg-red-500 hover:scale-[1.02]' : 'bg-black/40 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/20'}`}
        >
          {isOnAir ? "STOP ON-AIR" : "GO ON-AIR"}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 backdrop-blur-md border border-red-500/30 p-4 rounded-xl text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-3 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.1)]">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* EXPERT CANVAS VISUALIZER - Cinematic Dark Mode */}
        <div className="col-span-12 lg:col-span-8 bg-[#050505] border border-white/10 rounded-3xl p-8 h-[450px] relative flex flex-col justify-between overflow-hidden shadow-2xl group">
            
            {/* Ambient Background Gradient for depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black pointer-events-none z-0 opacity-80" />
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-red-600/10 rounded-full blur-[150px] transition-opacity duration-[2s] pointer-events-none z-0 ${isOnAir ? 'opacity-100' : 'opacity-0'}`} />
            
            {/* Top Indicator UI */}
            <div className="relative z-10 flex items-center justify-between border-b border-white/5 pb-5">
              <span className={`flex items-center gap-2 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-xl transition-all duration-500 ${isOnAir ? 'bg-red-500/15 text-red-400 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-white/5 text-zinc-500 border border-white/10'}`}>
                {isOnAir ? <><div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,1)]" /> LIVE TRANSMISSION</> : <><Square size={10} /> PREVIEW MODE</>}
              </span>
              <div className="flex items-center gap-5 text-[10px] text-zinc-500 font-mono font-bold tracking-widest bg-black/40 px-4 py-2 rounded-full border border-white/5">
                <span>FREQ: 48kHz</span>
                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                <span className={isOnAir ? "text-red-400 transition-colors" : ""}>BITRATE: 192kbps</span>
              </div>
            </div>

            {/* The Hardware-Accelerated Canvas */}
            <div className="relative z-10 flex-1 w-full mt-6">
                <canvas ref={canvasRef} className="w-full h-full block" />
            </div>
        </div>

        {/* Professional Mixing Console */}
        <div className="col-span-12 lg:col-span-4 space-y-6 font-mono uppercase">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 flex flex-col gap-10 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />
            
            <div className="relative z-10 flex items-center gap-3 border-b border-white/10 pb-5">
               <Sliders size={18} className="text-zinc-400" />
               <h3 className="text-xs font-black tracking-widest text-zinc-200">Mixing Console</h3>
            </div>
            
            <div className="relative z-10 space-y-6">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl transition-all duration-300 ${isMicActive ? 'bg-accent/20 text-accent shadow-[0_0_15px_rgba(229,9,20,0.2)] border border-accent/30' : 'bg-black/50 text-zinc-600 border border-white/5'}`}>
                      <Mic size={18} />
                    </div>
                    <span className="text-[11px] font-bold tracking-tighter text-zinc-300">Vocal Channel</span>
                  </div>
                  <button onClick={toggleMic} className={`text-[10px] px-5 py-2 rounded-lg font-black tracking-widest border transition-all duration-300 ${isMicActive ? 'bg-accent border-accent text-white shadow-[0_0_20px_rgba(229,9,20,0.5)]' : 'bg-black/50 border-white/10 text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                    {isMicActive ? 'ON' : 'OFF'}
                  </button>
               </div>
               <input type="range" value={micVolume} onChange={e => setMicVolume(parseInt(e.target.value))} className="w-full accent-accent h-2 bg-black/60 border border-white/5 appearance-none cursor-pointer rounded-full" />
            </div>

            <div className="relative z-10 space-y-6 pt-4 border-t border-white/5">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl transition-all duration-300 ${isSystemAudioActive ? 'bg-accent/20 text-accent shadow-[0_0_15px_rgba(229,9,20,0.2)] border border-accent/30' : 'bg-black/50 text-zinc-600 border border-white/5'}`}>
                      <Monitor size={18} />
                    </div>
                    <span className="text-[11px] font-bold tracking-tighter text-zinc-300">System Audio</span>
                  </div>
                  <button onClick={toggleSystemAudio} className={`text-[10px] px-5 py-2 rounded-lg font-black tracking-widest border transition-all duration-300 ${isSystemAudioActive ? 'bg-accent border-accent text-white shadow-[0_0_20px_rgba(229,9,20,0.5)]' : 'bg-black/50 border-white/10 text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                    {isSystemAudioActive ? 'ON' : 'OFF'}
                  </button>
               </div>
               <input type="range" value={systemVolume} onChange={e => setSystemVolume(parseInt(e.target.value))} className="w-full accent-accent h-2 bg-black/60 border border-white/5 appearance-none cursor-pointer rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}