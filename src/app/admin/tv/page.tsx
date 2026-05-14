"use client";

import React, { useState, useEffect, useRef } from "react";
import { Tv, Plus, Edit2, Trash2, Search, X, Save, Activity, Power, Image as ImageIcon, Upload, Loader2, Youtube, Video, Pin } from "lucide-react";

interface Category {
  id: number;
  name: string;
}

interface TvChannel {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  thumbnail: string | null;
  url: string;
  resolution: string;
  status: string;
  categoryId: number;
  streamType: string;
  isPinned: boolean;
  category?: Category;
}

export default function AdminTvPage() {
  const [channels, setChannels] = useState<TvChannel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentChannel, setCurrentChannel] = useState({
    id: null as number | null,
    name: "",
    slug: "",
    description: "",
    thumbnail: "",
    url: "",
    resolution: "1080p",
    status: "OFFLINE",
    categoryId: "",
    streamType: "M3U8",
    isPinned: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resTv, resCat] = await Promise.all([
        fetch("/api/tv"),
        fetch("/api/categories")
      ]);
      const dataTv = await resTv.json();
      const dataCat = await resCat.json();
      
      if (dataTv.success) {
        // Logika untuk menampilkan pin di urutan paling atas
        const sortedChannels = dataTv.data.sort((a: TvChannel, b: TvChannel) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return 0;
        });
        setChannels(sortedChannels);
      }
      if (dataCat.success) setCategories(dataCat.data);
    } catch (error) {
      console.error("Gagal load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      
      if (data.success) {
        setCurrentChannel({ ...currentChannel, thumbnail: data.url });
      } else {
        console.error("Upload response error:", data);
        alert("Gagal upload gambar: " + (data.error || "Unknown Error"));
      }
    } catch (err) {
      console.error("Network error during upload:", err);
      alert("Terjadi kesalahan koneksi saat upload");
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleLive = async (channel: TvChannel) => {
    const newStatus = channel.status === "LIVE" ? "OFFLINE" : "LIVE";
    try {
      const res = await fetch("/api/tv", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: channel.id, status: newStatus }),
      });
      if (res.ok) fetchData();
    } catch (error) {
      alert("Gagal merubah status live");
    }
  };

  const handleTogglePin = async (channel: TvChannel) => {
    try {
      const res = await fetch("/api/tv", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: channel.id, isPinned: !channel.isPinned }),
      });
      if (res.ok) fetchData();
    } catch (error) {
      alert("Gagal merubah status pin");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah lo yakin ingin menghapus channel ini? Tindakan ini tidak bisa dibatalkan.")) return;

    try {
      const res = await fetch(`/api/tv?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchData();
      } else {
        alert("Gagal menghapus data");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan koneksi");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = currentChannel.id ? "PATCH" : "POST";
    try {
      const res = await fetch("/api/tv", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentChannel),
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      }
    } catch (error) {
      alert("Gagal menyimpan data");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
            <Tv className="text-blue-500" size={28} />
            Manajemen Stream TV
          </h1>
          <p className="text-sm text-muted mt-1">Kontrol endpoint dan metadata siaran secara real-time.</p>
        </div>
        <button 
          onClick={() => {
            setCurrentChannel({ id: null, name: "", slug: "", description: "", thumbnail: "", url: "", resolution: "1080p", status: "OFFLINE", categoryId: "", streamType: "M3U8", isPinned: false });
            setIsModalOpen(true);
          }}
          className="flex w-fit items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-accent/90 shadow-[0_0_15px_rgba(229,9,20,0.3)]"
        >
          <Plus size={18} />
          Tambah Channel Baru
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/5 bg-surface shadow-2xl">
        <table className="w-full text-left text-sm text-white">
          <thead className="border-b border-white/5 bg-background/50 text-xs font-bold uppercase tracking-widest text-muted">
            <tr>
              <th className="px-6 py-4">Preview & Info</th>
              <th className="px-6 py-4">Kategori & Tipe</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Kontrol</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {channels.map((channel) => (
              <tr key={channel.id} className="transition-colors hover:bg-white/5 group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="relative h-12 w-20 overflow-hidden rounded bg-black border border-white/10">
                       {channel.thumbnail ? (
                         <img src={channel.thumbnail} alt="" className="h-full w-full object-cover" />
                       ) : (
                         <div className="flex h-full w-full items-center justify-center text-muted">
                           <ImageIcon size={16} />
                         </div>
                       )}
                       {channel.isPinned && (
                         <div className="absolute top-0 right-0 bg-yellow-500 p-0.5 rounded-bl shadow-md">
                           <Pin size={10} className="text-black fill-black" />
                         </div>
                       )}
                    </div>
                    <div>
                      <p className="font-bold text-white text-base flex items-center gap-2">
                        {channel.name}
                      </p>
                      <p className="text-[10px] font-mono text-muted truncate max-w-[150px]">{channel.url}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="w-fit rounded-sm bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                      {channel.category?.name || "Tanpa Kategori"}
                    </span>
                    <div className="flex items-center gap-2">
                       <span className="w-fit rounded-sm bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-500 border border-blue-500/20 uppercase tracking-wider">
                         {channel.resolution}
                       </span>
                       <span className={`w-fit rounded-sm px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wider flex items-center gap-1 ${channel.streamType === 'YOUTUBE' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                         {channel.streamType === 'YOUTUBE' ? <Youtube size={10} /> : <Video size={10} />}
                         {channel.streamType}
                       </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-2">
                    {channel.status === "LIVE" ? (
                      <span className="flex w-fit items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-green-500 border border-green-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                        LIVE
                      </span>
                    ) : (
                      <span className="flex w-fit items-center gap-1.5 rounded-full bg-muted/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-muted border border-muted/20">
                        OFFLINE
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button 
                      onClick={() => handleTogglePin(channel)}
                      title={channel.isPinned ? "Unpin dari Hero Section" : "Pin ke Hero Section"}
                      className={`rounded p-2 transition-colors ${
                        channel.isPinned 
                        ? "bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500 hover:text-white" 
                        : "bg-white/5 text-muted hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Pin size={16} className={channel.isPinned ? "fill-yellow-500" : ""} />
                    </button>
                    <button 
                      onClick={() => handleToggleLive(channel)}
                      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                        channel.status === "LIVE" 
                        ? "bg-red-500/10 text-red-500 hover:bg-red-500" 
                        : "bg-green-500/10 text-green-500 hover:bg-green-500"
                      } hover:text-white`}
                    >
                      <Power size={14} />
                      {channel.status === "LIVE" ? "STOP" : "START"}
                    </button>
                    <button 
                      onClick={() => {
                        setCurrentChannel({ 
                            id: channel.id,
                            name: channel.name,
                            slug: channel.slug,
                            description: channel.description || "",
                            thumbnail: channel.thumbnail || "",
                            url: channel.url,
                            resolution: channel.resolution,
                            status: channel.status,
                            categoryId: channel.categoryId.toString(),
                            streamType: channel.streamType,
                            isPinned: channel.isPinned
                        });
                        setIsModalOpen(true);
                      }}
                      className="rounded bg-white/5 p-2 text-muted hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(channel.id)}
                      className="rounded bg-red-500/10 p-2 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-surface p-6 shadow-2xl animate-in zoom-in duration-300 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Activity className="text-accent" size={20} />
                {currentChannel.id ? "Edit Konfigurasi" : "Setup Baru"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              
              <div className="flex items-center justify-between p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
                <div>
                  <label className="text-sm font-bold text-white block flex items-center gap-2">
                    <Pin size={16} className={currentChannel.isPinned ? "text-yellow-500 fill-yellow-500" : "text-muted"} />
                    Pin ke Hero Banner
                  </label>
                  <p className="text-[10px] text-muted mt-1">Jadikan channel ini prioritas utama di halaman depan jika statusnya LIVE.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={currentChannel.isPinned} onChange={(e) => setCurrentChannel({...currentChannel, isPinned: e.target.checked})} className="sr-only peer" />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted">Judul Siaran</label>
                  <input type="text" value={currentChannel.name} onChange={(e) => setCurrentChannel({...currentChannel, name: e.target.value})} className="w-full rounded-lg border border-white/10 bg-background p-3 text-sm text-white outline-none" required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted">Tipe Stream</label>
                  <select value={currentChannel.streamType} onChange={(e) => setCurrentChannel({...currentChannel, streamType: e.target.value})} className="w-full rounded-lg border border-white/10 bg-background p-3 text-sm text-white outline-none" required>
                    <option value="M3U8">M3U8 / HLS</option>
                    <option value="YOUTUBE">YouTube Embed</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted">URL Stream / Link YouTube</label>
                <input type="text" value={currentChannel.url} onChange={(e) => setCurrentChannel({...currentChannel, url: e.target.value})} className="w-full rounded-lg border border-white/10 bg-background p-3 text-sm text-white outline-none" placeholder={currentChannel.streamType === 'YOUTUBE' ? 'https://www.youtube.com/watch?v=...' : 'https://example.com/live.m3u8'} required />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted">Thumbnail (Import dari Device)</label>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 rounded-xl border border-dashed border-white/10 bg-background/50">
                  <div className="h-24 w-40 flex-shrink-0 overflow-hidden rounded-lg bg-black border border-white/5">
                    {currentChannel.thumbnail ? (
                      <img src={currentChannel.thumbnail} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted/30">
                        <ImageIcon size={32} />
                      </div>
                    )}
                  </div>
                  <div className="flex-grow space-y-3">
                    <p className="text-[10px] text-muted leading-relaxed">
                      Disarankan ukuran 1280x720px (16:9).<br/>Gambar akan disimpan di server lokal.
                    </p>
                    <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleFileUpload} />
                    <button 
                      type="button"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-xs font-bold text-white hover:bg-white/10 transition-all disabled:opacity-50"
                    >
                      {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                      {isUploading ? "Uploading..." : "Pilih Gambar"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted">Deskripsi</label>
                <textarea value={currentChannel.description} onChange={(e) => setCurrentChannel({...currentChannel, description: e.target.value})} className="w-full rounded-lg border border-white/10 bg-background p-3 text-sm text-white h-20 resize-none outline-none" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted">Kategori</label>
                  <select value={currentChannel.categoryId} onChange={(e) => setCurrentChannel({...currentChannel, categoryId: e.target.value})} className="w-full rounded-lg border border-white/10 bg-background p-3 text-sm text-white outline-none" required>
                    <option value="">Pilih Kategori</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted">Kualitas Default</label>
                  <select value={currentChannel.resolution} onChange={(e) => setCurrentChannel({...currentChannel, resolution: e.target.value})} className="w-full rounded-lg border border-white/10 bg-background p-3 text-sm text-white outline-none">
                    <option value="1080p">1080p</option>
                    <option value="720p">720p</option>
                    <option value="480p">480p</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted">Slug URL</label>
                  <input type="text" value={currentChannel.slug} onChange={(e) => setCurrentChannel({...currentChannel, slug: e.target.value})} className="w-full rounded-lg border border-white/10 bg-background p-3 text-sm text-white outline-none" required />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="submit" className="flex-grow flex items-center justify-center gap-2 rounded-lg bg-accent py-3 font-bold text-white hover:bg-accent/90 transition-all">
                  <Save size={18} /> Simpan Konfigurasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}