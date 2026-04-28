import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // Parameter filter waktu hanya akan digunakan untuk memotong data grafik
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "1h";
    
    let timeLimit = new Date(Date.now() - 60 * 60 * 1000); // 1 Jam
    if (range === "24h") timeLimit = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (range === "7d") timeLimit = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const expireTime = new Date(Date.now() - 45 * 1000);

    const tvChannels = await prisma.tvChannel.findMany({
      select: {
        id: true, name: true, status: true, viewers: true, peakViewers: true, 
        resolution: true, thumbnail: true, isPinned: true, createdAt: true,
      }
    });

    const tvWithHistory = await Promise.all(tvChannels.map(async (tv) => {
      // 1. Current Viewers: Akurat detik ini juga
      const liveViewers = await prisma.viewerSession.count({
        where: { channelId: tv.id, channelType: "tv", lastSeen: { gt: expireTime } }
      });

      // 2. Data Grafik: Dipotong berdasarkan filter waktu (range)
      const history = await prisma.viewerHistory.findMany({
        where: { channelId: tv.id, channelType: "tv", createdAt: { gte: timeLimit } },
        orderBy: { createdAt: "asc" }
      });
      
      // 3. Peak Viewers (All Time): PERBAIKAN - Cek Histori Terbesar Sepanjang Masa agar tidak bisa turun
      const absoluteMaxLog = await prisma.viewerHistory.aggregate({
        where: { channelId: tv.id, channelType: "tv" },
        _max: { viewerCount: true }
      });
      const absoluteHistoryPeak = absoluteMaxLog._max.viewerCount || 0;

      // Cari angka terbesar dari DB, Realtime, dan Log Histori (Self Healing logic)
      const actualPeak = Math.max(tv.peakViewers || 0, liveViewers, absoluteHistoryPeak);

      // Auto perbaiki nilai database jika ada miss data
      if (actualPeak > (tv.peakViewers || 0)) {
        await prisma.tvChannel.update({
          where: { id: tv.id },
          data: { peakViewers: actualPeak }
        }).catch(() => {}); // catch silent agar tidak block load data
      }

      return { ...tv, type: "tv", viewers: liveViewers, peakViewers: actualPeak, history };
    }));

    const radioChannels = await prisma.radioChannel.findMany({
      select: {
        id: true, name: true, status: true, listeners: true, peakListeners: true, 
        bitrate: true, thumbnail: true, createdAt: true,
      }
    });

    const radioWithHistory = await Promise.all(radioChannels.map(async (radio) => {
      const liveListeners = await prisma.viewerSession.count({
        where: { channelId: radio.id, channelType: "radio", lastSeen: { gt: expireTime } }
      });

      const history = await prisma.viewerHistory.findMany({
        where: { channelId: radio.id, channelType: "radio", createdAt: { gte: timeLimit } },
        orderBy: { createdAt: "asc" }
      });
      
      const absoluteMaxLog = await prisma.viewerHistory.aggregate({
        where: { channelId: radio.id, channelType: "radio" },
        _max: { viewerCount: true }
      });
      const absoluteHistoryPeak = absoluteMaxLog._max.viewerCount || 0;

      const actualPeak = Math.max(radio.peakListeners || 0, liveListeners, absoluteHistoryPeak);

      if (actualPeak > (radio.peakListeners || 0)) {
        await prisma.radioChannel.update({
          where: { id: radio.id },
          data: { peakListeners: actualPeak }
        }).catch(() => {});
      }

      return { 
        ...radio, type: "radio", viewers: liveListeners, peakViewers: actualPeak, 
        isPinned: false, history 
      };
    }));

    const allStreams = [...tvWithHistory, ...radioWithHistory].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      if (a.type === "tv" && b.type === "radio") return -1;
      if (a.type === "radio" && b.type === "tv") return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({ success: true, data: allStreams }, { status: 200 });

  } catch (error) {
    console.error("Analytics API Error:", error);
    return NextResponse.json({ success: false, message: "Gagal mengambil data" }, { status: 500 });
  }
}