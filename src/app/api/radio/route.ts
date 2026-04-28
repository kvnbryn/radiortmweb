// New folder (6)/src/app/api/radio/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ... method GET, POST, PATCH tetap dipertahankan ...

export async function GET(request: NextRequest) {
  try {
    const radioChannels = await prisma.radioChannel.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: radioChannels }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, description, thumbnail, url, bitrate, status, categoryId } = body;
    const newRadio = await prisma.radioChannel.create({
      data: {
        name,
        slug,
        description,
        thumbnail,
        url,
        bitrate: bitrate || "128kbps",
        status: (status as any) || "OFFLINE",
        categoryId: parseInt(categoryId),
      },
      include: { category: true }
    });
    return NextResponse.json({ success: true, data: newRadio }, { status: 201 });
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
    const updatedRadio = await prisma.radioChannel.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { category: true }
    });
    return NextResponse.json({ success: true, data: updatedRadio }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Error" }, { status: 500 });
  }
}

// --- TAMBAHKAN INI ---
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "ID diperlukan" }, { status: 400 });
    }

    await prisma.radioChannel.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ success: true, message: "Stasiun Radio berhasil dihapus" }, { status: 200 });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ success: false, message: "Gagal menghapus radio" }, { status: 500 });
  }
}