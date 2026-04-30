"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { 
  Search, User, Menu, X, PlayCircle, Mic2, 
  LogOut, ShieldCheck, Mail, ChevronRight, Loader2, Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UserData { username: string; email: string; role: string; }

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const userModalRef = useRef<HTMLDivElement>(null);

  const [settings, setSettings] = useState({ siteName: "", logoUrl: "" });
  const [isBrandingLoaded, setIsBrandingLoaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resUser, resSettings] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/settings")
        ]);
        const dataUser = await resUser.json();
        const dataSettings = await resSettings.json();
        if (dataUser.success) setUserData(dataUser.user);
        if (dataSettings.success && dataSettings.data) {
          setSettings({ 
            siteName: dataSettings.data.siteName || "VisionStream", 
            logoUrl: dataSettings.data.logoUrl || "" 
          });
        }
      } catch (err) { setUserData(null); }
      finally { setIsLoadingProfile(false); setIsBrandingLoaded(true); }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen || isSearchOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
  }, [isMobileMenuOpen, isSearchOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userModalRef.current && !userModalRef.current.contains(event.target as Node)) {
        setIsUserModalOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) { setUserData(null); window.location.href = "/"; }
    } catch (error) { alert("Gagal logout"); }
  };

  const handleUserClick = () => {
    if (isLoadingProfile) return;
    if (userData) setIsUserModalOpen(!isUserModalOpen);
    else router.push("/login");
  };

  // REVISI EXPERT: Semua class text-accent sekarang pakai warna Red Cinematic
  return (
    <>
      <nav className={`fixed top-0 z-50 w-full transition-all duration-500 ${isScrolled ? "bg-black/95 backdrop-blur-md border-b border-white/5 py-3 shadow-2xl" : "bg-gradient-to-b from-black/80 to-transparent py-5"}`}>
        <div className="container mx-auto flex items-center justify-between px-6 md:px-12">
          <div className="flex items-center gap-10">
            <Link href="/" className="transition-transform hover:scale-105 min-w-[150px]">
              {!isBrandingLoaded ? (
                <div className="h-8 w-32 animate-pulse bg-white/10 rounded-lg" />
              ) : settings.logoUrl ? (
                <img src={settings.logoUrl} alt={settings.siteName} className="h-9 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
              ) : (
                <span className="text-2xl font-black tracking-tighter text-red-600 uppercase italic drop-shadow-[0_0_10px_rgba(220,38,38,0.7)]">
                  {settings.siteName.split(' ')[0]}<span className="text-white">{settings.siteName.split(' ')[1] || ""}</span>
                </span>
              )}
            </Link>
            
            <div className="hidden items-center gap-7 text-sm font-bold text-gray-300 md:flex">
              <Link href="/" className={`transition-colors ${pathname === "/" ? "text-white" : "hover:text-red-500"}`}>Beranda</Link>
              <Link href="/tv" className={`transition-colors ${pathname.startsWith("/tv") ? "text-white" : "hover:text-red-500"}`}>TV Live</Link>
              <Link href="/radio" className={`transition-colors ${pathname.startsWith("/radio") ? "text-white" : "hover:text-red-500"}`}>Radio Online</Link>
              <Link href="/category" className={`transition-colors ${pathname.startsWith("/category") ? "text-white" : "hover:text-red-500"}`}>Kategori</Link>
            </div>
          </div>

          <div className="flex items-center gap-6 text-white">
            <button onClick={() => setIsSearchOpen(true)} className="cursor-pointer hover:text-red-500 transition-all hover:scale-110"><Search size={20} strokeWidth={2.5} /></button>
            
            <div className="relative" ref={userModalRef}>
              <button onClick={handleUserClick} className="flex items-center gap-2 cursor-pointer group">
                <div className={`h-10 w-10 rounded-full bg-zinc-800 border ${userData ? 'border-red-600' : 'border-white/20'} flex items-center justify-center overflow-hidden transition-all group-hover:border-red-600 group-hover:shadow-[0_0_15px_rgba(220,38,38,0.4)]`}>
                   {isLoadingProfile ? <Loader2 size={16} className="animate-spin text-zinc-500" /> : userData ? <span className="text-xs font-black text-red-600 tracking-widest">{userData.username.substring(0, 2).toUpperCase()}</span> : <User size={18} className="text-zinc-400 group-hover:text-white" />}
                </div>
              </button>

              <AnimatePresence>
                {isUserModalOpen && userData && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute right-0 top-full mt-4 w-60 origin-top-right rounded-2xl border border-white/10 bg-black/90 p-2 shadow-[0_15px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl"
                  >
                    <div className="mb-2 flex flex-col items-center justify-center rounded-xl bg-white/5 p-4 text-center">
                      <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-600/20 border border-red-600/40 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
                        <span className="text-lg font-black text-red-600">{userData.username.substring(0, 2).toUpperCase()}</span>
                      </div>
                      <p className="w-full truncate text-sm font-bold text-white">{userData.username}</p>
                      <p className="w-full truncate text-xs text-zinc-400">{userData.email}</p>
                      <span className="mt-2 rounded bg-white/10 px-2.5 py-1 text-[10px] font-black tracking-widest text-white uppercase">
                        {userData.role}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 text-sm font-bold">
                      {(userData.role === "ADMIN" || userData.role === "SUPERADMIN") && (
                        <Link 
                          href="/admin" 
                          onClick={() => setIsUserModalOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          <ShieldCheck size={16} className="text-blue-400" /> Admin Panel
                        </Link>
                      )}
                      
                      <button 
                        onClick={() => { setIsUserModalOpen(false); handleLogout(); }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-red-500 transition-colors hover:bg-red-500/10 text-left"
                      >
                        <LogOut size={16} /> Keluar Akun
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button className="md:hidden text-white/80" onClick={() => setIsMobileMenuOpen(true)}><Menu size={24} strokeWidth={2.5} /></button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="fixed inset-0 z-[60] flex flex-col bg-black md:hidden backdrop-blur-xl">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <span className="italic">
                {settings.logoUrl ? <img src={settings.logoUrl} alt={settings.siteName} className="h-7 object-contain" /> : 
                <span className="text-xl font-black text-red-600 uppercase italic">{settings.siteName.split(' ')[0]}<span className="text-white">{settings.siteName.split(' ')[1] || ""}</span></span>}
              </span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="rounded-full bg-white/10 p-2 text-white"><X size={20} /></button>
            </div>
            <div className="flex flex-col gap-6 p-8 text-lg font-bold">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className={pathname === "/" ? "text-white" : "text-zinc-500 hover:text-red-500"}>Beranda</Link>
              <Link href="/tv" onClick={() => setIsMobileMenuOpen(false)} className={pathname.startsWith("/tv") ? "text-white" : "text-zinc-500 hover:text-red-500"}>TV Live</Link>
              <Link href="/radio" onClick={() => setIsMobileMenuOpen(false)} className={pathname.startsWith("/radio") ? "text-white" : "text-zinc-500 hover:text-red-500"}>Radio Online</Link>
              <Link href="/category" onClick={() => setIsMobileMenuOpen(false)} className={pathname.startsWith("/category") ? "text-white" : "text-zinc-500 hover:text-red-500"}>Kategori</Link>
              <Link href="/terms" onClick={() => setIsMobileMenuOpen(false)} className="text-zinc-500 hover:text-white text-sm pt-4 border-t border-white/5">Syarat & Kebijakan</Link>
            </div>
            <div className="mt-auto p-8 border-t border-white/10">
              <button onClick={() => { setIsMobileMenuOpen(false); handleUserClick(); }} className="flex items-center gap-4 w-full">
                <div className={`h-10 w-10 rounded-full bg-zinc-900 border ${userData ? 'border-red-600' : 'border-white/20'} flex items-center justify-center`}>{userData ? <span className="text-xs font-black text-red-600">{userData.username.substring(0, 2).toUpperCase()}</span> : <User size={20} className="text-zinc-500" />}</div>
                <div className="text-left"><p className="text-sm font-bold text-white">{userData ? userData.username : "Masuk Akun"}</p><p className="text-xs text-zinc-500 tracking-wider uppercase font-black">{userData ? userData.role : "Klik"}</p></div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}