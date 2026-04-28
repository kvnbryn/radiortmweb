import React from "react";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Radio, 
  Tv, 
  Video, 
  Settings, 
  FolderTree, 
  BarChart3,
  LogOut,
  Zap
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: "Dashboard", href: "/admin" },
    { icon: <Radio size={20} />, label: "Siaran Center", href: "/admin/radio" },
    { icon: <Tv size={20} />, label: "TV Channels", href: "/admin/tv" },
    { icon: <Video size={20} />, label: "Shorts Box", href: "/admin/shorts" },
    { icon: <FolderTree size={20} />, label: "Categories", href: "/admin/category" },
    { icon: <BarChart3 size={20} />, label: "Analytics", href: "/admin/analytics" },
    { icon: <Settings size={20} />, label: "Settings", href: "/admin/settings" },
  ];

  return (
    <div className="flex min-h-screen bg-[#020202] text-white selection:bg-blue-500/30">
      {/* Sidebar - Pro Glassmorphism */}
      <aside className="w-72 border-r border-white/5 flex flex-col fixed inset-y-0 left-0 z-50 bg-black/40 backdrop-blur-3xl">
        <div className="p-8">
          {/* Logo Section - Balik ke Original Image Logic */}
          <div className="flex items-center gap-4 mb-12 group cursor-pointer">
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden border border-white/10 group-hover:border-blue-500/50 transition-all duration-500 shadow-2xl shadow-blue-500/10">
              <img 
                src="/logo.png" 
                alt="VisionStream Logo" 
                className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-700" 
              />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tighter leading-none">VISION</span>
              <span className="text-[10px] tracking-[0.3em] text-blue-500 font-bold uppercase opacity-80">Stream Studio</span>
            </div>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item, idx) => (
              <Link
                key={idx}
                href={item.href}
                className="flex items-center gap-4 px-5 py-4 text-zinc-400 hover:text-white rounded-2xl transition-all duration-300 hover:bg-white/5 border border-transparent hover:border-white/5 group"
              >
                <span className="group-hover:scale-110 group-hover:text-blue-500 transition-all duration-300">
                  {item.icon}
                </span>
                <span className="text-sm font-semibold tracking-tight">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-8">
          <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-600/20 to-transparent border border-blue-500/20 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={14} className="text-blue-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300">Node Status</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">Server VPS Jakarta aktif dengan performa 10Gbps.</p>
          </div>
          
          <button className="flex items-center gap-4 w-full px-5 py-4 text-zinc-500 hover:text-red-400 transition-all duration-300 rounded-2xl hover:bg-red-500/5">
            <LogOut size={20} />
            <span className="text-sm font-bold uppercase tracking-widest">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-72 relative">
        {/* Cinematic Ambient Glow */}
        <div className="fixed top-0 right-0 w-[800px] h-[600px] bg-blue-600/5 blur-[160px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="fixed bottom-0 left-0 w-[600px] h-[400px] bg-purple-600/5 blur-[140px] rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none" />
        
        <div className="relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}