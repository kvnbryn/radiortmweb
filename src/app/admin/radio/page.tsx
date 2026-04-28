"use client";

import React, { useState, useEffect, useRef } from "react";
import { Radio as RadioIcon, Plus, Edit2, Trash2, Search, X, Save, Activity, Power, Image as ImageIcon, Upload, Loader2, Headphones } from "lucide-react";

interface Category {
  id: number;
  name: string;
}

interface RadioChannel {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  thumbnail: string | null;
  url: string;
  bitrate: string;
  status: string;
  categoryId: number;
  category?: Category;
}

export default function AdminRadioPage() {
  const [channels, setChannels] = useState<RadioChannel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentRadio, setCurrentRadio] = useState({
    id: null as number | null,
    name: "",
    slug: "",
    description: "",
    thumbnail: "",
    url: "",
    bitrate: "128kbps",
    status: "OFFLINE",
    categoryId: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resRadio, resCat] = await Promise.all([
        fetch("/api/radio"),
        fetch("/api/categories")
      ]);
      const dataRadio = await resRadio.json();
      const dataCat = await resCat.json();
      
      if (dataRadio.success) setChannels(dataRadio.data);
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
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) setCurrentRadio({ ...currentRadio, thumbnail: data.url });
    } catch (err) {
      alert("Gagal upload gambar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleLive = async (radio: RadioChannel) => {
    const newStatus = radio.status === "LIVE" ? "OFFLINE" : "LIVE";
    try {
      const res = await fetch("/api/radio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: radio.id, status: newStatus }),
      });
      if (res.ok) fetchData();
    } catch (error) {
      alert("Gagal merubah status siaran");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus stasiun radio ini?")) return;
    try {
      const res = await fetch(`/api/radio?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchData();
      } else {
        alert("Gagal menghapus");
      }
    } catch (err) {
      alert("Error koneksi");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = currentRadio.id ? "PATCH" : "POST";
    try {
      const res = await fetch("/api/radio", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentRadio),
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
            <Headphones className="text-green-500" size={28} />
            Manajemen Radio
          </h1>
          <p className="text-sm text-muted mt-1">Kelola stasiun radio, URL Icecast/Shoutcast, dan bitrate.</p>
        </div>
        <button 
          onClick={() => {
            setCurrentRadio({ id: null, name: "", slug: "", description: "", thumbnail: "", url: "", bitrate: "128kbps", status: "OFFLINE", categoryId: "" });
            setIsModalOpen(true);
          }}
          className="flex w-fit items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-green-700 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
        >
          <Plus size={18} />
          Tambah Stasiun Baru
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/5 bg-surface shadow-2xl">
        <table className="w-full text-left text-sm text-white">
          <thead className="border-b border-white/5 bg-background/50 text-xs font-bold uppercase tracking-widest text-muted">
            <tr>
              <th className="px-6 py-4">Stasiun Radio</th>
              <th className="px-6 py-4">Info Teknis</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Kontrol</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {channels.map((radio) => (
              <tr key={radio.id} className="transition-colors hover:bg-white/5 group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 overflow-hidden rounded-lg bg-black border border-white/10 flex-shrink-0">
                       {radio.thumbnail ? (
                         <img src={radio.thumbnail} alt="" className="h-full w-full object-cover" />
                       ) : (
                         <div className="flex h-full w-full items-center justify-center text-muted/50">
                           <RadioIcon size={20} />
                         </div>
                       )}
                    </div>
                    <div>
                      <p className="font-bold text-white text-base">{radio.name}</p>
                      <p className="text-[10px] font-mono text-muted uppercase">/{radio.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="w-fit rounded-sm bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                      {radio.category?.name || "No Category"}
                    </span>
                    <span className="w-fit rounded-sm bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-500 border border-green-500/20 uppercase tracking-wider">
                      {radio.bitrate}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {radio.status === "LIVE" ? (
                    <span className="flex w-fit items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-green-500 border border-green-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                      ON AIR
                    </span>
                  ) : (
                    <span className="flex w-fit items-center gap-1.5 rounded-full bg-muted/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-muted border border-muted/20">
                      OFF AIR
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button 
                      onClick={() => handleToggleLive(radio)}
                      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                        radio.status === "LIVE" 
                        ? "bg-red-500/10 text-red-500 hover:bg-red-500" 
                        : "bg-green-500/10 text-green-500 hover:bg-green-500"
                      } hover:text-white`}
                    >
                      <Power size={14} />
                      {radio.status === "LIVE" ? "STOP" : "START"}
                    </button>
                    <button 
                      onClick={() => {
                        setCurrentRadio({ 
                            id: radio.id,
                            name: radio.name,
                            slug: radio.slug,
                            description: radio.description || "",
                            thumbnail: radio.thumbnail || "",
                            url: radio.url,
                            bitrate: radio.bitrate,
                            status: radio.status,
                            categoryId: radio.categoryId.toString() 
                        });
                        setIsModalOpen(true);
                      }}
                      className="rounded bg-white/5 p-2 text-muted hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(radio.id)}
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
                <Activity className="text-green-500" size={20} />
                {currentRadio.id ? "Edit Stasiun Radio" : "Setup Stasiun Baru"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted">Nama Stasiun</label>
                  <input type="text" value={currentRadio.name} onChange={(e) => setCurrentRadio({...currentRadio, name: e.target.value})} className="w-full rounded-lg border border-white/10 bg-background p-3 text-sm text-white outline-none" required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted">URL Stream (Icecast/MP3)</label>
                  <input type="text" value={currentRadio.url} onChange={(e) => setCurrentRadio({...currentRadio, url: e.target.value})} className="w-full rounded-lg border border-white/10 bg-background p-3 text-sm text-white outline-none" placeholder="http://ip:port/stream" required />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted">Cover/Thumbnail (Import Device)</label>
                <div className="flex flex-col sm:flex-row gap-4 items-center p-4 rounded-xl border border-dashed border-white/10 bg-background/50">
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-black border border-white/5">
                    {currentRadio.thumbnail ? (
                      <img src={currentRadio.thumbnail} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted/30">
                        <ImageIcon size={24} />
                      </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleFileUpload} />
                    <button 
                      type="button"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-xs font-bold text-white hover:bg-white/10 transition-all disabled:opacity-50"
                    >
                      {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                      {isUploading ? "Uploading..." : "Pilih Cover"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted">Deskripsi Radio</label>
                <textarea value={currentRadio.description} onChange={(e) => setCurrentRadio({...currentRadio, description: e.target.value})} className="w-full rounded-lg border border-white/10 bg-background p-3 text-sm text-white h-20 resize-none outline-none" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted">Kategori</label>
                  <select value={currentRadio.categoryId} onChange={(e) => setCurrentRadio({...currentRadio, categoryId: e.target.value})} className="w-full rounded-lg border border-white/10 bg-background p-3 text-sm text-white outline-none" required>
                    <option value="">Pilih Kategori</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted">Bitrate</label>
                  <select value={currentRadio.bitrate} onChange={(e) => setCurrentRadio({...currentRadio, bitrate: e.target.value})} className="w-full rounded-lg border border-white/10 bg-background p-3 text-sm text-white outline-none">
                    <option value="320kbps">320 kbps (Ultra)</option>
                    <option value="192kbps">192 kbps (High)</option>
                    <option value="128kbps">128 kbps (Standard)</option>
                    <option value="64kbps">64 kbps (Low)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted">Slug URL</label>
                  <input type="text" value={currentRadio.slug} onChange={(e) => setCurrentRadio({...currentRadio, slug: e.target.value})} className="w-full rounded-lg border border-white/10 bg-background p-3 text-sm text-white outline-none" required />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="submit" className="flex-grow flex items-center justify-center gap-2 rounded-lg bg-green-600 py-3 font-bold text-white hover:bg-green-700 transition-all">
                  <Save size={18} /> Simpan Konfigurasi Radio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}