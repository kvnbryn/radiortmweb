import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, channelId, channelType } = body;

    if (!identifier || !channelId || !channelType) {
      return NextResponse.json({ success: false, message: "Missing params" }, { status: 400 });
    }

    const cId = parseInt(channelId);
    // PERBAIKAN: Pakai lowercase untuk keamanan komparasi
    const safeChannelType = channelType.toLowerCase();

    // 1. Update atau Create session user ini
    await prisma.viewerSession.upsert({
      where: {
        identifier_channelId_channelType: {
          identifier,
          channelId: cId,
          channelType: safeChannelType,
        },
      },
      update: {
        lastSeen: new Date(),
      },
      create: {
        identifier,
        channelId: cId,
        channelType: safeChannelType,
      },
    });

    // 2. Cleanup: Hapus session yang sudah tidak update lebih dari 45 detik
    const expireTime = new Date(Date.now() - 45 * 1000);
    await prisma.viewerSession.deleteMany({
      where: {
        lastSeen: {
          lt: expireTime,
        },
      },
    });

    // 3. Hitung jumlah viewer real-time saat ini
    const activeViewers = await prisma.viewerSession.count({
      where: {
        channelId: cId,
        channelType: safeChannelType,
        lastSeen: {
          gt: expireTime,
        },
      },
    });

    // 4. Update data Current Viewers & Peak Viewers (Rekor Tertinggi)
    // PERBAIKAN: Menggunakan Math.max yang lebih presisi dan menghindari nilai null
    if (safeChannelType === "tv") {
      const tv = await prisma.tvChannel.findUnique({ where: { id: cId }, select: { peakViewers: true } });
      const currentPeak = tv?.peakViewers || 0;
      const newPeak = Math.max(currentPeak, activeViewers);

      await prisma.tvChannel.update({
        where: { id: cId },
        data: { 
          viewers: activeViewers,
          peakViewers: newPeak
        }
      });
    } else if (safeChannelType === "radio") {
      const radio = await prisma.radioChannel.findUnique({ where: { id: cId }, select: { peakListeners: true } });
      const currentPeak = radio?.peakListeners || 0;
      const newPeak = Math.max(currentPeak, activeViewers);

      await prisma.radioChannel.update({
        where: { id: cId },
        data: { 
          listeners: activeViewers,
          peakListeners: newPeak
        }
      });
    }

    // 5. Simpan histori untuk grafik (Dibatasi 1 data per menit per channel biar DB aman)
    const ONE_MINUTE = 60 * 1000;
    const lastHistory = await prisma.viewerHistory.findFirst({
      where: { channelId: cId, channelType: safeChannelType },
      orderBy: { createdAt: "desc" }
    });

    if (!lastHistory || (new Date().getTime() - new Date(lastHistory.createdAt).getTime() > ONE_MINUTE)) {
      await prisma.viewerHistory.create({
        data: {
          channelId: cId,
          channelType: safeChannelType,
          viewerCount: activeViewers
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      viewers: activeViewers 
    }, { status: 200 });

  } catch (error) {
    console.error("Heartbeat Error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}