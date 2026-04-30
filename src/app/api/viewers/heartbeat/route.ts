import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, channelId, channelType } = body;

    // 1. Validasi Input yang lebih ketat
    if (!identifier || !channelId || !channelType) {
      return NextResponse.json({ success: false, message: "Invalid parameters" }, { status: 400 });
    }

    const cId = parseInt(channelId);
    if (isNaN(cId)) return NextResponse.json({ success: false }, { status: 400 });

    const safeChannelType = channelType.toLowerCase();

    // 2. Proteksi Abuse: Cek apakah user ini terlalu sering kirim request (Rate Limit simple)
    // Kita cek apakah session terakhir kurang dari 10 detik yang lalu
    const lastSession = await prisma.viewerSession.findUnique({
        where: {
            identifier_channelId_channelType: {
                identifier,
                channelId: cId,
                channelType: safeChannelType,
            },
        },
        select: { lastSeen: true }
    });

    if (lastSession && (new Date().getTime() - new Date(lastSession.lastSeen).getTime() < 10000)) {
        // Jika request kurang dari 10 detik, abaikan update DB tapi kembalikan sukses biar ga boros bandwidth
        return NextResponse.json({ success: true, message: "Throttled" }, { status: 200 });
    }

    // 3. Update atau Create session
    await prisma.viewerSession.upsert({
      where: {
        identifier_channelId_channelType: {
          identifier,
          channelId: cId,
          channelType: safeChannelType,
        },
      },
      update: { lastSeen: new Date() },
      create: {
        identifier,
        channelId: cId,
        channelType: safeChannelType,
      },
    });

    // 4. Cleanup Sesi Expired (Lebih dari 45 detik tidak ada kabar)
    const expireTime = new Date(Date.now() - 45 * 1000);
    await prisma.viewerSession.deleteMany({
      where: { lastSeen: { lt: expireTime } },
    });

    // 5. Hitung Real-time Viewers
    const activeViewers = await prisma.viewerSession.count({
      where: {
        channelId: cId,
        channelType: safeChannelType,
        lastSeen: { gt: expireTime },
      },
    });

    // 6. Update Stats Channel (Current & Peak Viewers)
    if (safeChannelType === "tv") {
      const tv = await prisma.tvChannel.findUnique({ where: { id: cId }, select: { peakViewers: true } });
      const newPeak = Math.max(tv?.peakViewers || 0, activeViewers);
      await prisma.tvChannel.update({
        where: { id: cId },
        data: { viewers: activeViewers, peakViewers: newPeak }
      });
    } else if (safeChannelType === "radio") {
      const radio = await prisma.radioChannel.findUnique({ where: { id: cId }, select: { peakListeners: true } });
      const newPeak = Math.max(radio?.peakListeners || 0, activeViewers);
      await prisma.radioChannel.update({
        where: { id: cId },
        data: { listeners: activeViewers, peakListeners: newPeak }
      });
    }

    // 7. Simpan histori untuk grafik (Dibatasi 1 data per menit per channel biar DB aman)
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

    return NextResponse.json({ success: true, viewers: activeViewers }, { status: 200 });

  } catch (error) {
    console.error("Heartbeat Error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}