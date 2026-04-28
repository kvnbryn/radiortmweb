// src/app/login/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Lock, User as UserIcon, Mail, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  
  // State UI
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  // State Input
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // State Loading & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // State Branding Dinamis
  const [settings, setSettings] = useState({ siteName: "", logoUrl: "" });
  const [isBrandingLoaded, setIsBrandingLoaded] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data.success && data.data) {
          setSettings({
            siteName: data.data.siteName || "Live Stream",
            logoUrl: data.data.logoUrl || ""
          });
        } else {
          setSettings({ siteName: "Live Stream", logoUrl: "" });
        }
      } catch (err) {
        setSettings({ siteName: "Live Stream", logoUrl: "" });
      } finally {
        setIsBrandingLoaded(true);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      
      const payload = isLogin 
        ? { username, password } 
        : { username, email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Terjadi kesalahan pada server");
      }

      if (isLogin) {
        setSuccessMessage("Login berhasil! Mengalihkan...");
        
        setTimeout(() => {
          if (data.role === "ADMIN" || data.role === "SUPERADMIN") {
            window.location.href = "/admin/tv";
          } else {
            window.location.href = "/";
          }
        }, 800);
      } else {
        setSuccessMessage("Pendaftaran berhasil! Silakan masuk.");
        setTimeout(() => {
          setIsLogin(true);
          setPassword(""); 
          setSuccessMessage("");
        }, 2000);
      }
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background selection:bg-accent selection:text-white overflow-hidden">
      
      {/* Background Cinematic */}
      <div className="absolute inset-0 z-0">
        <div className="h-full w-full bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30" />
      </div>

      <nav className="absolute top-0 left-0 z-20 w-full p-6 md:p-10">
        <Link href="/" className="inline-block transition-transform hover:scale-105 min-w-[150px]">
          {!isBrandingLoaded ? (
            <div className="h-8 w-32 animate-pulse bg-white/10 rounded-lg" />
          ) : settings.logoUrl ? (
            <img src={settings.logoUrl} alt={settings.siteName} className="h-10 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
          ) : (
            <span className="text-3xl font-black tracking-tighter text-accent uppercase italic drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.7)]">
              {settings.siteName.split(' ')[0]}<span className="text-white">{settings.siteName.split(' ').slice(1).join(' ')}</span>
            </span>
          )}
        </Link>
      </nav>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-10 w-full max-w-md px-6 md:px-0"
      >
        <div className="rounded-2xl border border-white/10 bg-black/60 p-8 shadow-2xl backdrop-blur-2xl md:p-12">
          
          <h1 className="mb-2 text-3xl font-bold text-white">
            {isLogin ? "Masuk" : "Daftar Akun"}
          </h1>
          <p className="mb-8 text-sm text-muted">
            {isLogin 
              ? `Selamat datang kembali di ${settings.siteName || "sistem"}.` 
              : "Buat akun baru untuk mengelola siaran."}
          </p>

          <AnimatePresence mode="wait">
            {errorMessage && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm font-bold text-red-500 border border-red-500/20">
                <AlertCircle size={18} /> {errorMessage}
              </motion.div>
            )}
            {successMessage && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 flex items-center gap-2 rounded-lg bg-green-500/10 p-3 text-sm font-bold text-green-500 border border-green-500/20">
                <CheckCircle2 size={18} /> {successMessage}
              </motion.div>
            )}
          </AnimatePresence>
          
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <div className="group relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-muted group-focus-within:text-white">
                <UserIcon size={20} />
              </div>
              <input 
                type="text" 
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-white/20 bg-white/5 py-4 pl-12 pr-4 text-white outline-none focus:border-accent transition-all"
                required
              />
            </div>

            <AnimatePresence>
              {!isLogin && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="group relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-muted group-focus-within:text-white">
                    <Mail size={20} />
                  </div>
                  <input 
                    type="email" 
                    placeholder="Alamat Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-white/20 bg-white/5 py-4 pl-12 pr-4 text-white outline-none focus:border-accent transition-all"
                    required={!isLogin}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="group relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-muted group-focus-within:text-white">
                <Lock size={20} />
              </div>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Kata Sandi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/20 bg-white/5 py-4 pl-12 pr-12 text-white outline-none focus:border-accent transition-all"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 text-muted hover:text-white">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-4 font-bold text-white shadow-lg active:scale-95 disabled:opacity-70 transition-all"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? "Masuk" : "Buat Akun Baru")}
            </button>

            <div className="mt-4 text-center text-sm text-muted font-medium">
              {isLogin ? "" : "Sudah punya akses? "}
              <button 
                type="button" 
                onClick={() => setIsLogin(!isLogin)}
                className="font-black text-white hover:text-accent transition-colors underline underline-offset-4"
              >
                {isLogin ? "" : "Masuk Sini"}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}