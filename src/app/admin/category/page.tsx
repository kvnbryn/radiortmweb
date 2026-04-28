"use client";

import React, { useState, useEffect } from "react";
import { 
  Layers, Plus, Edit2, Trash2, Search, Tv, 
  Radio as RadioIcon, X, Save, Loader2, Activity,
  Image as ImageIcon, UploadCloud
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Definisi Tipe Data
interface Category {
  id: number;
  name: string;
  slug: string;
  color: string;
  thumbnail?: string | null;
  _count?: {
    tvChannels: number;
    radios: number;
  };
}

// Gambar Bawaan (Preset) yang bisa dipilih admin
const PRESET_IMAGES = [
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1514539079130-25950c84af65?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1438032005730-c779502df39b?q=80&w=600&auto=format&fit=crop',
];

export default function AdminCategoryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // State untuk Upload Gambar
  const [isUploading, setIsUploading] = useState(false);
  const [thumbnailMode, setThumbnailMode] = useState<"preset" | "upload">("preset");
  
  // State untuk Modal & Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: null as number | null,
    name: "",
    slug: "",
    color: "bg-red-500",
    thumbnail: ""
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error("Gagal mengambil kategori:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, "");
    setFormData({ ...formData, name, slug });
  };

  const handleEdit = (cat: Category) => {
    setFormData({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      color: "bg-red-500",
      thumbnail: cat.thumbnail || ""
    });
    
    // Tentukan mode awal berdasarkan apakah gambarnya dari preset atau upload sendiri
    if (cat.thumbnail && PRESET_IMAGES.includes(cat.thumbnail)) {
      setThumbnailMode("preset");
    } else if (cat.thumbnail) {
      setThumbnailMode("upload");
    } else {
      setThumbnailMode("preset");
    }
    
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah lo yakin ingin menghapus kategori ini? Semua relasi siaran mungkin akan terpengaruh.")) return;
    
    try {
      const res = await fetch(`/api/categories?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchCategories();
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Gagal menghapus kategori");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const uploadData = new FormData();
    uploadData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });
      const data = await res.json();
      if (data.success) {
        setFormData({ ...formData, thumbnail: data.url });
      } else {
        alert("Gagal mengupload gambar.");
      }
    } catch (error) {
      alert("Terjadi kesalahan saat upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const isEdit = formData.id !== null;
    const method = isEdit ? "PATCH" : "POST";

    try {
      const res = await fetch("/api/categories", {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        setFormData({ id: null, name: "", slug: "", color: "bg-red-500", thumbnail: "" });
        fetchCategories();
      } else {
        alert(data.message || "Gagal menyimpan kategori");
      }
    } catch (error) {
      alert("Terjadi kesalahan koneksi");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
            <Layers className="text-red-500" size={28} />
            Kategori Siaran
          </h1>
          <p className="text-sm text-muted mt-1">Kelola label kategori untuk mengelompokkan siaran TV dan Radio.</p>
        </div>
        <button 
          onClick={() => {
            setFormData({ id: null, name: "", slug: "", color: "bg-red-500", thumbnail: "" });
            setThumbnailMode("preset");
            setIsModalOpen(true);
          }}
          className="flex w-fit items-center justify-center gap-2 rounded-lg bg-red-500 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-red-600 shadow-[0_0_15px_rgba(229,9,20,0.3)] hover:-translate-y-0.5"
        >
          <Plus size={18} />
          Tambah Kategori
        </button>
      </div>

      <div className="relative max-w-md group">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted group-focus-within:text-white transition-colors">
          <Search size={18} />
        </div>
        <input 
          type="text" 
          placeholder="Cari nama kategori..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-surface py-2.5 pl-10 pr-4 text-sm text-white outline-none transition-all focus:border-red-500 focus:bg-white/5 focus:ring-1 focus:ring-red-500"
        />
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="animate-spin text-red-500" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCategories.map((cat) => (
            <div key={cat.id} className="group relative overflow-hidden rounded-xl border border-white/5 bg-surface p-6 shadow-lg transition-all hover:border-white/20 hover:-translate-y-1 hover:shadow-2xl">
              
              {/* Menampilkan background thumbnail jika ada */}
              {cat.thumbnail && (
                <div 
                  className="absolute inset-0 z-0 bg-cover bg-center opacity-10 transition-opacity duration-500 group-hover:opacity-20"
                  style={{ backgroundImage: `url('${cat.thumbnail}')` }}
                />
              )}
              
              {!cat.thumbnail && (
                <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-red-500 opacity-10 blur-3xl transition-opacity group-hover:opacity-20`} />
              )}
              
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-black text-white">{cat.name}</h3>
                  <p className="text-xs font-mono text-muted mt-1">/{cat.slug}</p>
                </div>
                <div className="flex gap-2 opacity-100 md:opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <button 
                    onClick={() => handleEdit(cat)}
                    className="rounded bg-white/5 p-2 text-muted hover:bg-white/10 hover:text-white transition-colors" 
                    title="Edit"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => handleDelete(cat.id)}
                    className="rounded bg-red-500/10 p-2 text-red-500 hover:bg-red-500/20 transition-colors" 
                    title="Hapus"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="relative z-10 mt-6 flex items-center gap-4 border-t border-white/5 pt-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                    <Tv size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted">TV</p>
                    <p className="text-sm font-black text-white">{cat._count?.tvChannels || 0} Channel</p>
                  </div>
                </div>
                <div className="h-8 border-r border-white/10" />
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                    <RadioIcon size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Radio</p>
                    <p className="text-sm font-black text-white">{cat._count?.radios || 0} Stasiun</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL TAMBAH/EDIT KATEGORI */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-lg rounded-2xl border border-white/10 bg-surface p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Activity className="text-red-500" size={20} />
                  {formData.id ? "Edit Kategori" : "Kategori Baru"}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted">Nama Kategori</label>
                    <input 
                      type="text" 
                      value={formData.name} 
                      onChange={handleNameChange}
                      placeholder="Contoh: Olahraga"
                      className="w-full rounded-lg border border-white/10 bg-background p-3 text-sm text-white outline-none focus:border-red-500" 
                      required 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted">Slug URL</label>
                    <input 
                      type="text" 
                      value={formData.slug} 
                      onChange={(e) => setFormData({...formData, slug: e.target.value})}
                      className="w-full rounded-lg border border-white/10 bg-background p-3 text-sm text-white outline-none focus:border-red-500" 
                      required 
                    />
                  </div>
                </div>

                {/* Bagian Pemilihan Gambar / Thumbnail */}
                <div className="space-y-3 rounded-xl border border-white/5 bg-background p-4">
                  <label className="text-xs font-bold uppercase text-muted flex items-center gap-2">
                    <ImageIcon size={14} /> Background / Thumbnail Kategori
                  </label>
                  
                  {/* Tabs Pemilihan Mode */}
                  <div className="flex rounded-lg bg-surface p-1">
                    <button
                      type="button"
                      onClick={() => setThumbnailMode("preset")}
                      className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-colors ${
                        thumbnailMode === "preset" ? "bg-red-500 text-white" : "text-muted hover:text-white"
                      }`}
                    >
                      Pilih Bawaan
                    </button>
                    <button
                      type="button"
                      onClick={() => setThumbnailMode("upload")}
                      className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-colors ${
                        thumbnailMode === "upload" ? "bg-red-500 text-white" : "text-muted hover:text-white"
                      }`}
                    >
                      Upload Sendiri
                    </button>
                  </div>

                  {/* Mode: Preset Bawaan */}
                  {thumbnailMode === "preset" && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {PRESET_IMAGES.map((img, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => setFormData({ ...formData, thumbnail: img })}
                          className={`relative aspect-[4/3] cursor-pointer overflow-hidden rounded-lg border-2 transition-all ${
                            formData.thumbnail === img ? "border-red-500 opacity-100 scale-95" : "border-transparent opacity-60 hover:opacity-100"
                          }`}
                        >
                          <img src={img} alt={`Preset ${idx + 1}`} className="h-full w-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Mode: Upload Custom */}
                  {thumbnailMode === "upload" && (
                    <div className="mt-3">
                      <div className="flex w-full items-center justify-center">
                        <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/20 bg-surface transition-all hover:bg-white/5">
                          <div className="flex flex-col items-center justify-center pb-6 pt-5">
                            {isUploading ? (
                              <Loader2 className="mb-2 text-red-500 animate-spin" size={28} />
                            ) : (
                              <UploadCloud className="mb-2 text-muted" size={28} />
                            )}
                            <p className="mb-1 text-sm text-muted">
                              <span className="font-bold text-white">Klik untuk upload</span> gambar
                            </p>
                            <p className="text-xs text-muted/60">PNG, JPG atau WEBP</p>
                          </div>
                          <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isUploading} />
                        </label>
                      </div>
                      
                      {/* Preview Custom Upload */}
                      {formData.thumbnail && !PRESET_IMAGES.includes(formData.thumbnail) && (
                        <div className="mt-4 relative h-32 w-full overflow-hidden rounded-lg border border-white/10">
                          <img src={formData.thumbnail} alt="Preview Upload" className="h-full w-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => setFormData({ ...formData, thumbnail: "" })}
                            className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white hover:bg-red-500 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button 
                  type="submit" 
                  disabled={isSaving || isUploading}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-500 py-3 font-bold text-white hover:bg-red-600 transition-all disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {isSaving ? "Memproses..." : (formData.id ? "Update Kategori" : "Simpan Kategori")}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}