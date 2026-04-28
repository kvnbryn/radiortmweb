"use client";

import React, { useState, useEffect } from "react";
import { 
  Settings as SettingsIcon, Save, Globe, Shield, 
  Loader2, FileText, HelpCircle, Eye, Youtube, Link as LinkIcon, Key, Layers
} from "lucide-react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

// Load ReactQuillNew secara dinamis
const ReactQuill = dynamic(() => import("react-quill-new"), { 
  ssr: false,
  loading: () => <div className="h-64 w-full animate-pulse bg-white/5 rounded-lg border border-white/10" />
});

export default function AdminSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  const [categories, setCategories] = useState<any[]>([]);

  // State Form Settings Lengkap
  const [settings, setSettings] = useState({
    siteName: "", 
    seoDescription: "",
    autoPlay: true,
    isMaintenance: false,
    logoUrl: "",
    defaultThumbnail: "",
    termsContent: "",
    privacyContent: "",
    helpContent: "",
    youtubeApiKey: "",
    youtubeChannelLink: "",
    youtubeCategoryId: 0 // Default 0 (Belum pilih)
  });

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });

  useEffect(() => { 
    fetchSettings(); 
    fetchCategories();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (json.success && json.data) {
        setSettings(json.data);
      }
    } catch (error) {
      console.error("Gagal memuat pengaturan", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const json = await res.json();
      if (json.success) {
        setCategories(json.data);
      }
    } catch (error) {
      console.error("Gagal memuat kategori", error);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) { alert("Semua perubahan berhasil disimpan!"); }
    } catch (error) { alert("Gagal menyimpan."); }
    finally { setIsSaving(false); }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordData)
      });
      const data = await res.json();
      if (res.ok) { 
        alert("Kata sandi diperbarui!"); 
        setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" }); 
      } else {
        // PERBAIKAN: Tangkap pesan error dari API jika salah password
        alert(data.message || "Gagal memperbarui kata sandi.");
      }
    } catch (error) { alert("Terjadi kesalahan jaringan."); }
    finally { setIsChangingPassword(false); }
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "clean"],
    ],
  };

  if (isLoading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-accent" size={40} /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-700 max-w-6xl pb-24 text-white">
      
      {/* Header Dinamis */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface/50 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-xl">
              <SettingsIcon className="text-accent" size={28} />
            </div>
            Pengaturan {settings.siteName || "Sistem"}
          </h1>
          <p className="text-sm text-muted mt-1">Kelola identitas dan kebijakan otoritas {settings.siteName}.</p>
        </div>
        
        {activeTab !== "security" && (
          <button onClick={handleSaveSettings} disabled={isSaving} className="flex items-center justify-center gap-3 rounded-xl bg-accent px-8 py-3.5 text-sm font-black transition-all hover:bg-accent/90 hover:-translate-y-1 active:scale-95 disabled:opacity-50 shadow-[0_0_20px_rgba(229,9,20,0.3)]">
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Simpan Perubahan
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Navigasi Kiri */}
        <div className="w-full lg:w-64 shrink-0">
          <nav className="sticky top-24 flex flex-col gap-1.5 p-2 bg-surface rounded-2xl border border-white/5">
            {[
              { id: "general", label: "Umum & SEO", icon: Globe },
              { id: "youtube", label: "Auto-Post YouTube", icon: Youtube },
              { id: "terms", label: "Syarat Layanan", icon: FileText },
              { id: "privacy", label: "Privasi", icon: Eye },
              { id: "help", label: "Bantuan", icon: HelpCircle },
              { id: "security", label: "Keamanan", icon: Shield },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold transition-all ${activeTab === tab.id ? "bg-accent text-white shadow-lg" : "text-muted hover:bg-white/5 hover:text-white"}`}>
                <tab.icon size={18} /> {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Konten Kanan */}
        <div className="flex-grow space-y-8 animate-in slide-in-from-right-4 duration-500">
          
          {activeTab === "general" && (
            <div className="rounded-2xl border border-white/5 bg-surface p-8 shadow-2xl space-y-8">
              <h2 className="text-xl font-black flex items-center gap-3"><span className="h-8 w-1 bg-accent rounded-full" /> Identitas Platform</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Nama Situs</label>
                  <input type="text" value={settings.siteName} onChange={(e) => setSettings({...settings, siteName: e.target.value})} className="w-full rounded-xl border border-white/10 bg-background p-4 text-sm outline-none focus:border-accent" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">SEO Deskripsi</label>
                  <input type="text" value={settings.seoDescription || ""} onChange={(e) => setSettings({...settings, seoDescription: e.target.value})} className="w-full rounded-xl border border-white/10 bg-background p-4 text-sm outline-none focus:border-accent" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Logo URL</label>
                  <input type="text" value={settings.logoUrl || ""} onChange={(e) => setSettings({...settings, logoUrl: e.target.value})} className="w-full rounded-xl border border-white/10 bg-background p-4 text-sm outline-none focus:border-accent" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Thumbnail Default</label>
                  <input type="text" value={settings.defaultThumbnail || ""} onChange={(e) => setSettings({...settings, defaultThumbnail: e.target.value})} className="w-full rounded-xl border border-white/10 bg-background p-4 text-sm outline-none focus:border-accent" />
                </div>
              </div>
              <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5">
                  <div><h3 className="text-sm font-bold uppercase">Auto-Play</h3><p className="text-[11px] text-muted">Putar otomatis siaran.</p></div>
                  <button onClick={() => setSettings({...settings, autoPlay: !settings.autoPlay})} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all ${settings.autoPlay ? 'bg-accent' : 'bg-zinc-700'}`}>
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${settings.autoPlay ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-5 rounded-2xl bg-red-500/5 border border-red-500/10">
                  <div><h3 className="text-sm font-bold text-red-500 uppercase">Maintenance</h3><p className="text-[11px] text-red-500/60">Kunci akses publik.</p></div>
                  <button onClick={() => setSettings({...settings, isMaintenance: !settings.isMaintenance})} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all ${settings.isMaintenance ? 'bg-red-500' : 'bg-zinc-700'}`}>
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${settings.isMaintenance ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB BARU: AUTO-POST YOUTUBE (Desain Clean & Natural) */}
          {activeTab === "youtube" && (
            <div className="rounded-2xl border border-white/5 bg-surface p-8 shadow-2xl">
              <div className="mb-8">
                <h2 className="text-xl font-black flex items-center gap-3">
                  <span className="h-8 w-1 bg-red-600 rounded-full" /> Konfigurasi Integrasi YouTube
                </h2>
                <p className="text-sm text-muted mt-2 ml-4">
                  Sistem akan secara otomatis memeriksa dan mempublikasikan siaran langsung dari channel YouTube yang Anda tentukan di bawah ini setiap satu jam sekali.
                </p>
              </div>

              <div className="space-y-8 ml-4">
                
                {/* Section 1: API Key */}
                <div className="flex flex-col md:flex-row gap-6 pb-8 border-b border-white/5">
                  <div className="w-full md:w-1/3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2"><Key size={16} className="text-red-500" /> API Key</h3>
                    <p className="text-xs text-muted mt-1 leading-relaxed">Kunci akses dari Google Cloud Console untuk membaca data YouTube secara resmi.</p>
                  </div>
                  <div className="w-full md:w-2/3">
                    <input 
                      type="password" 
                      placeholder="AIzaSy............................."
                      value={settings.youtubeApiKey || ""} 
                      onChange={(e) => setSettings({...settings, youtubeApiKey: e.target.value})} 
                      className="w-full rounded-xl border border-white/10 bg-background p-4 text-sm font-mono text-white outline-none focus:border-red-500 transition-colors" 
                    />
                  </div>
                </div>

                {/* Section 2: Channel Link */}
                <div className="flex flex-col md:flex-row gap-6 pb-8 border-b border-white/5">
                  <div className="w-full md:w-1/3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2"><LinkIcon size={16} className="text-red-500" /> Link Channel</h3>
                    <p className="text-xs text-muted mt-1 leading-relaxed">Tempel link channel YouTube target. Bisa menggunakan format <span className="text-white">@username</span> atau ID channel panjang.</p>
                  </div>
                  <div className="w-full md:w-2/3">
                    <input 
                      type="text" 
                      placeholder="https://www.youtube.com/@NamaChannel"
                      value={settings.youtubeChannelLink || ""} 
                      onChange={(e) => setSettings({...settings, youtubeChannelLink: e.target.value})} 
                      className="w-full rounded-xl border border-white/10 bg-background p-4 text-sm text-white outline-none focus:border-red-500 transition-colors" 
                    />
                  </div>
                </div>

                {/* Section 3: Kategori Penempatan */}
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-1/3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2"><Layers size={16} className="text-red-500" /> Kategori Siaran</h3>
                    <p className="text-xs text-muted mt-1 leading-relaxed">Setiap siaran Live otomatis dari YouTube akan langsung dimasukkan ke dalam kategori ini.</p>
                  </div>
                  <div className="w-full md:w-2/3">
                    <div className="relative">
                      <select 
                        value={settings.youtubeCategoryId || 0}
                        onChange={(e) => setSettings({...settings, youtubeCategoryId: parseInt(e.target.value)})}
                        className="w-full appearance-none rounded-xl border border-white/10 bg-background p-4 text-sm text-white outline-none focus:border-red-500 transition-colors cursor-pointer"
                      >
                        <option value={0} disabled>-- Pilih Kategori Siaran --</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-muted">
                        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {(activeTab === "terms" || activeTab === "privacy" || activeTab === "help") && (
            <div className="rounded-2xl border border-white/5 bg-surface p-8 shadow-2xl space-y-6">
              <h2 className="text-xl font-black flex items-center gap-3"><span className="h-8 w-1 bg-accent rounded-full" /> Edit Konten</h2>
              <div className="bg-white rounded-2xl overflow-hidden text-black quill-admin-container border-4 border-white/5">
                <ReactQuill theme="snow" modules={modules} value={activeTab === "terms" ? settings.termsContent || "" : activeTab === "privacy" ? settings.privacyContent || "" : settings.helpContent || ""} onChange={(content) => {
                  if (activeTab === "terms") setSettings({...settings, termsContent: content});
                  else if (activeTab === "privacy") setSettings({...settings, privacyContent: content});
                  else setSettings({...settings, helpContent: content});
                }} className="min-h-[400px]" />
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="rounded-2xl border border-white/5 bg-surface p-8 shadow-2xl">
              <h2 className="text-xl font-black mb-8 flex items-center gap-3"><span className="h-8 w-1 bg-yellow-500 rounded-full" /> Akses Admin</h2>
              <form onSubmit={handlePasswordChange} className="max-w-md space-y-6 ml-4">
                {/* PERBAIKAN: Menambahkan kolom input Password Lama */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Password Lama</label>
                  <input 
                    type="password" 
                    required 
                    value={passwordData.oldPassword} 
                    onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})} 
                    className="w-full rounded-xl border border-white/10 bg-background p-4 text-sm outline-none focus:border-yellow-500" 
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Password Baru</label>
                  <input 
                    type="password" 
                    required 
                    minLength={6} 
                    value={passwordData.newPassword} 
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} 
                    className="w-full rounded-xl border border-white/10 bg-background p-4 text-sm outline-none focus:border-yellow-500" 
                  />
                </div>

                {/* PERBAIKAN: Menambahkan kolom input Konfirmasi Password */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Konfirmasi Password Baru</label>
                  <input 
                    type="password" 
                    required 
                    minLength={6} 
                    value={passwordData.confirmPassword} 
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})} 
                    className="w-full rounded-xl border border-white/10 bg-background p-4 text-sm outline-none focus:border-yellow-500" 
                  />
                </div>

                <button type="submit" disabled={isChangingPassword} className="w-full bg-yellow-500 text-black py-4 font-black uppercase text-xs rounded-xl hover:bg-yellow-400 transition-all shadow-lg mt-4">
                  {isChangingPassword ? "Memperbarui..." : "Update Kredensial"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
      <style jsx global>{`.ql-container { min-height: 400px; font-family: inherit; font-size: 15px; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px; } .ql-toolbar { border-top-left-radius: 12px; border-top-right-radius: 12px; background: #f1f5f9; border-color: transparent !important; } .ql-editor { min-height: 400px; }`}</style>
    </div>
  );
}