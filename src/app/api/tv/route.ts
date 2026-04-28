import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const tvChannels = await prisma.tvChannel.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    // Tambahkan data viewer real-time ke setiap channel
    const channelsWithRealViewers = await Promise.all(
      tvChannels.map(async (channel) => {
        const count = await prisma.viewerSession.count({
          where: {
            channelId: channel.id,
            channelType: "TV",
            lastSeen: {
              gt: new Date(Date.now() - 45 * 1000),
            },
          },
        });
        return { ...channel, viewers: count };
      })
    );

    return NextResponse.json({ success: true, data: channelsWithRealViewers }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, description, thumbnail, url, resolution, status, categoryId, streamType, isPinned } = body;
    const newTvChannel = await prisma.tvChannel.create({
      data: {
        name,
        slug,
        description: description || "",
        thumbnail,
        url,
        resolution: resolution || "1080p",
        status: (status as any) || "OFFLINE",
        categoryId: parseInt(categoryId),
        streamType: streamType || "M3U8",
        isPinned: Boolean(isPinned),
      },
      include: { category: true }
    });
    return NextResponse.json({ success: true, data: newTvChannel }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    if (updateData.categoryId) updateData.categoryId = parseInt(updateData.categoryId);
    if (updateData.status) updateData.status = updateData.status as any;
    if (updateData.streamType) updateData.streamType = updateData.streamType as any;
    if (updateData.isPinned !== undefined) updateData.isPinned = Boolean(updateData.isPinned);

    const updatedChannel = await prisma.tvChannel.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { category: true }
    });
    return NextResponse.json({ success: true, data: updatedChannel }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "ID diperlukan" }, { status: 400 });
    }

    await prisma.tvChannel.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ success: true, message: "Channel berhasil dihapus" }, { status: 200 });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ success: false, message: "Gagal menghapus data" }, { status: 500 });
  }
}