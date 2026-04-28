import React from "react";
import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="flex h-[70vh] w-full flex-col items-center justify-center animate-in fade-in duration-300">
      
      {/* Efek Glow di belakang spinner */}
      <div className="absolute flex items-center justify-center opacity-20">
        <div className="h-32 w-32 rounded-full bg-accent/20 blur-[60px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Spinner Khusus Admin Dashboard */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inline-flex h-16 w-16 animate-ping rounded-full bg-accent/20" />
          <Loader2 
            size={48} 
            className="animate-spin text-accent drop-shadow-[0_0_15px_rgba(229,9,20,0.6)]" 
            strokeWidth={1.5} 
          />
        </div>

        {/* Skeleton Text untuk ilusi loading data */}
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm font-bold tracking-widest text-white uppercase drop-shadow-md">
            Menyiapkan Data Panel...
          </p>
          <div className="flex gap-1.5">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted/60" style={{ animationDelay: "0ms" }} />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted/60" style={{ animationDelay: "150ms" }} />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted/60" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>

    </div>
  );
}