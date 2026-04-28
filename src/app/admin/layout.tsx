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
  MonitorPlay
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: "Dashboard", href: "/admin" },
    { icon: <MonitorPlay size={20} />, label: "Siaran Center", href: "/admin/radio" },
    { icon: <Tv size={20} />, label: "TV Management", href: "/admin/tv" },
    { icon: <Video size={20} />, label: "Shorts Editor", href: "/admin/shorts" },
    { icon: <FolderTree size={20} />, label: "Categories", href: "/admin/category" },
    { icon: <BarChart3 size={20} />, label: "Analytics", href: "/admin/analytics" },
    { icon: <Settings size={20} />, label: "System Config", href: "/admin/settings" },
  ];

  return (
    <div className="flex min-h-screen bg-[#050505]">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-white/5 flex flex-col fixed inset-y-0 left-0 z-50 bg-[#050505]/80 backdrop-blur-2xl">
        <div className="p-8">
          <div className="flex items-center gap-2 mb-10">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-black rounded-sm" />
            </div>
            <span className="font-bold text-xl tracking-tighter text-white">VISION<span className="text-zinc-600">STREAM</span></span>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item, idx) => (
              <Link
                key={idx}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
              >
                <span className="group-hover:scale-110 transition-transform">{item.icon}</span>
                <span className="text-sm font-medium tracking-tight">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-white/5">
          <button className="flex items-center gap-3 w-full px-4 py-3 text-zinc-500 hover:text-red-400 transition-colors">
            <LogOut size={20} />
            <span className="text-sm font-medium">Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}