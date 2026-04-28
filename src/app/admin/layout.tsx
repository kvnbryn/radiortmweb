"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, Tv, Radio, Layers, Settings, LogOut, Menu, X, Users, Activity, Video
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const [branding, setBranding] = useState({ siteName: "", logoUrl: "" });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const res = await fetch("/api/settings");
        const json = await res.json();
        if (json.success && json.data) {
          setBranding({
            siteName: json.data.siteName || "VisionStream",
            logoUrl: json.data.logoUrl || ""
          });
        }
      } catch (error) {
        console.error("Gagal load branding admin");
      } finally {
        setIsLoaded(true);
      }
    };
    fetchBranding();
  }, []);

  const handleLogout = async () => {
    if (!confirm("Yakin ingin keluar dari panel admin?")) return;
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        router.push("/login");
        router.refresh();
      } else {
        alert("Gagal melakukan logout.");
      }
    } catch (error) {
      alert("Terjadi kesalahan jaringan saat logout.");
    }
  };

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: <LayoutDashboard size={20} /> },
    { label: "Kelola TV", href: "/admin/tv", icon: <Tv size={20} /> },
    { label: "Siaran Center", href: "/admin/radio", icon: <Radio size={20} /> },
    { label: "Kelola Shorts", href: "/admin/shorts", icon: <Video size={20} /> },
    { label: "Kategori", href: "/admin/category", icon: <Layers size={20} /> },
    { label: "Laporan", href: "/admin/analytics", icon: <Activity size={20} /> },
    { label: "Pengaturan", href: "/admin/settings", icon: <Settings size={20} /> },
  ];

  const SidebarContent = () => (
    <div className="flex h-full flex-col justify-between bg-surface border-r border-white/5 p-6">
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="mb-10 flex items-center gap-2">
          <Link href="/" className="transition-transform hover:scale-105 flex items-center">
            {!isLoaded ? (
              <div className="h-8 w-32 animate-pulse bg-white/10 rounded-lg" />
            ) : branding.logoUrl ? (
              <img src={branding.logoUrl} alt={branding.siteName} className="h-8 object-contain" />
            ) : (
              <span className="text-2xl font-black tracking-tighter text-accent uppercase italic">
                {branding.siteName.split(' ')[0]}<span className="text-white">{branding.siteName.split(' ')[1] || ""}</span>
              </span>
            )}
          </Link>
          <span className="rounded bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent border border-accent/50 ml-2 shrink-0">ADMIN</span>
        </div>
        
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            // Perbaikan Bug Navigasi: Dashboard (/admin) hanya active jika path bener-bener /admin
            const isActive = item.href === "/admin" 
              ? pathname === "/admin" 
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold transition-all ${
                  isActive 
                    ? "bg-accent/10 text-accent border border-accent/20 shadow-[0_0_15px_rgba(229,9,20,0.1)]" 
                    : "text-muted hover:bg-white/5 hover:text-white border border-transparent"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <button 
        onClick={handleLogout}
        className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-muted transition-all hover:bg-red-500/10 hover:text-red-500 mt-auto border border-transparent hover:border-red-500/20 w-full shrink-0"
      >
        <LogOut size={20} />
        Keluar
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background text-white selection:bg-accent selection:text-white">
      <aside className="hidden w-72 shrink-0 md:block fixed h-screen z-20">
        <SidebarContent />
      </aside>

      <button 
        className="fixed top-4 right-4 z-50 rounded-md bg-surface p-2 border border-white/10 md:hidden shadow-lg backdrop-blur-md"
        onClick={() => setIsMobileMenuOpen(true)}
      >
        <Menu size={24} />
      </button>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm md:hidden"
            />
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-[60] w-72 shadow-2xl md:hidden bg-surface h-full"
            >
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute top-6 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors z-10"
              >
                <X size={20} />
              </button>
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-grow md:ml-72 flex flex-col min-h-screen transition-all w-full overflow-hidden">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-background/80 backdrop-blur-xl px-6 py-4 md:px-10">
          <div>
            <h2 className="text-lg font-bold text-white hidden md:block">Panel Kendali {branding.siteName || "Sistem"}</h2>
          </div>
          <div className="flex items-center gap-4 ml-auto md:ml-0">
             <div className="text-right hidden sm:block">
               <p className="text-sm font-bold">Studio Pusat</p>
               <p className="text-[10px] uppercase tracking-widest text-accent font-black">Superadmin</p>
             </div>
             <div className="h-10 w-10 rounded-full bg-surface border border-white/20 flex items-center justify-center shadow-lg">
               <Users size={18} className="text-white" />
             </div>
          </div>
        </header>

        <main className="flex-grow p-4 sm:p-6 md:p-10 w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}