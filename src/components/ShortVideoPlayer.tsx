"use client";

import React from "react";

interface ShortVideoPlayerProps {
  youtubeId: string;
}

export default function ShortVideoPlayer({ youtubeId }: ShortVideoPlayerProps) {
  // origin krusial untuk handshake API YouTube agar tidak error
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const videoSrc = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&controls=0&rel=0&modestbranding=1&loop=1&playlist=${youtubeId}&enablejsapi=1&origin=${origin}`;

  return (
    <div className="w-full h-full bg-black">
      <iframe
        src={videoSrc}
        className="w-full h-full border-0 pointer-events-none"
        allow="autoplay; encrypted-media"
      />
    </div>
  );
}