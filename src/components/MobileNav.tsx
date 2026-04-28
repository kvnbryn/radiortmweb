"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Tv, Radio, LayoutGrid, User } from "lucide-react";
import { motion } from "framer-motion";

export default function MobileNav() {
  const pathname = usePathname();

  // Daftar menu untuk navigasi bawah
  const navItems = [
    { name: "Beranda", href: "/", icon: Home },
    { name: "TV Live", href: "/tv", icon: Tv },
    { name: "Radio", href: "/radio", icon: Radio },
    { name: "Eksplor", href: "/category", icon: LayoutGrid },
    { name: "Profil", href: "/login", icon: User }, // Sementara arahin ke login
  ];

  // Jangan tampilkan Bottom Nav kalau user lagi di halaman Admin atau Login
  if (pathname.startsWith("/admin") || pathname === "/login") {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] block md:hidden">
      {/* Gradient bayangan di atas nav biar nyampur sama konten WFlix */}
      <div className="h-12 w-full bg-gradient-to-t from-background to-transparent" />
      
      {/* Container Bottom Nav - Glassmorphism pekat */}
      <nav className="bg-background/90 border-t border-white/5 pb-safe pt-2 backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.8)] px-2 sm:px-6">
        <div className="flex items-center justify-around pb-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link 
                key={item.name} 
                href={item.href}
                className="relative flex flex-col items-center justify-center w-16 h-12 gap-1"
              >
                {/* Indikator Aktif (Glow di atas icon) */}
                {isActive && (
                  <motion.div 
                    layoutId="mobileNavIndicator"
                    className="absolute -top-3 w-8 h-1 rounded-b-full bg-accent shadow-[0_0_10px_rgba(229,9,20,0.8)]"
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  />
                )}
                
                <Icon 
                  size={22} 
                  strokeWidth={isActive ? 2.5 : 2} 
                  className={`transition-all duration-300 ${isActive ? "text-white scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "text-muted hover:text-white/80"}`} 
                />
                <span className={`text-[9px] font-bold tracking-wider transition-colors duration-300 ${isActive ? "text-white" : "text-muted"}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}