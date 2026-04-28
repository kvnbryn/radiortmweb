"use client";

import React, { useState, useEffect } from "react";
import { Play, Plus, Edit2, Trash2, X, Save, Video, Youtube, Image as ImageIcon, Loader2 } from "lucide-react";

interface Short {
  id: number;
  title: string;
  slug: string;
  youtubeId: string;
  thumbnail: string | null;
  views: number;
  likeCount?: number;
}

export default function AdminShortsPage() {
  const [shorts, setShorts] = useState<Short[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [currentShort, setCurrentShort] = useState({
    id: null as number | null,
    title: "",
    slug: "",
    youtubeId: "",
    thumbnail: "",
  });

  useEffect(() => {
    fetchShorts();
  }, []);

  const fetchShorts = async () => {
    try {
      const res = await fetch("/api/shorts");
      const data = await res.json();
      if (data.success) setShorts(data.data);
    } catch (error) {
      console.error("Gagal load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const extractYoutubeId = (url: string) => {
    const regex = /(?:youtube\.com\/shorts\/|v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : url;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = currentShort.id ? "PATCH" : "POST";
    const payload = {
      ...currentShort,
      youtubeId: extractYoutubeId(currentShort.youtubeId)
    };

    try {
      const res = await fetch("/api/shorts", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchShorts();
      }
    } catch (error) {
      alert("Gagal menyimpan data");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus Short ini?")) return;
    try {
      const res = await fetch(`/api/shorts?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchShorts();
    } catch (err) {
      alert("Gagal menghapus");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
            <Video className="text-red-500" size={28} />
            Manajemen Shorts
          </h1>
          <p className="text-sm text-muted mt-1">Kelola konten video pendek bergaya YouTube Shorts.</p>
        </div>
        <button 
          onClick={() => {
            setCurrentShort({ id: null, title: "", slug: "", youtubeId: "", thumbnail: "" });
            setIsModalOpen(true);
          }}
          className="flex w-fit items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-accent/90 shadow-[0_0_15px_rgba(229,9,20,0.3)]"
        >
          <Plus size={18} />
          Tambah Short Baru
        </button>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="animate-spin text-accent" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {shorts.map((item) => (
            <div key={item.id} className="group relative aspect-[9/16] overflow-hidden rounded-xl border border-white/5 bg-surface shadow-xl transition-all hover:border-accent/50">
              <img 
                src={item.thumbnail || `https://img.youtube.com/vi/${item.youtubeId}/maxresdefault.jpg`} 
                alt={item.title} 
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-100" />
              
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-xs font-bold text-white line-clamp-2 mb-2">{item.title}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setCurrentShort({ id: item.id, title: item.title, slug: item.slug, youtubeId: item.youtubeId, thumbnail: item.thumbnail || "" });
                        setIsModalOpen(true);
                      }}
                      className="rounded bg-white/10 p-1.5 text-white hover:bg-white/20 transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="rounded bg-red-500/20 p-1.5 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <span className="text-[10px] font-mono text-muted uppercase">ID: {item.youtubeId}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-surface p-6 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Youtube className="text-red-500" size={20} />
                {currentShort.id ? "Edit Short" : "Tambah Short"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted">Judul Video</label>
                <input type="text" value={currentShort.title} onChange={(e) => setCurrentShort({...currentShort, title: e.target.value})} className="w-full rounded-lg border border-white/10 bg-background p-3 text-sm text-white outline-none" placeholder="Contoh: Momen Epik Live" required />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted">Slug URL</label>
                <input type="text" value={currentShort.slug} onChange={(e) => setCurrentShort({...currentShort, slug: e.target.value})} className="w-full rounded-lg border border-white/10 bg-background p-3 text-sm text-white outline-none" placeholder="momen-epik" required />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted">Link YouTube Shorts / ID Video</label>
                <input type="text" value={currentShort.youtubeId} onChange={(e) => setCurrentShort({...currentShort, youtubeId: e.target.value})} className="w-full rounded-lg border border-white/10 bg-background p-3 text-sm text-white outline-none" placeholder="https://www.youtube.com/shorts/abcd123" required />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted">Custom Thumbnail URL (Opsional)</label>
                <input type="text" value={currentShort.thumbnail} onChange={(e) => setCurrentShort({...currentShort, thumbnail: e.target.value})} className="w-full rounded-lg border border-white/10 bg-background p-3 text-sm text-white outline-none" placeholder="https://..." />
                <p className="text-[10px] text-muted">Biarkan kosong untuk menggunakan thumbnail otomatis dari YouTube.</p>
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent py-3 font-bold text-white hover:bg-accent/90 transition-all">
                  <Save size={18} /> Simpan Data Short
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}