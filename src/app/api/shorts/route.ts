import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "5");
    const offset = parseInt(searchParams.get("offset") || "0");

    const shorts = await prisma.short.findMany({
      take: limit,
      skip: offset,
      include: {
        _count: {
          select: { likes: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    const data = shorts.map(item => ({
      ...item,
      likeCount: item._count.likes,
      _count: undefined
    }));

    return NextResponse.json({ 
      success: true, 
      data,
      hasMore: data.length === limit 
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, slug, youtubeId, thumbnail } = body;

    const newShort = await prisma.short.create({
      data: {
        title,
        slug,
        youtubeId,
        thumbnail: thumbnail || null,
      }
    });

    return NextResponse.json({ success: true, data: newShort }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    const updatedShort = await prisma.short.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    return NextResponse.json({ success: true, data: updatedShort }, { status: 200 });
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

    await prisma.short.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ success: true, message: "Short berhasil dihapus" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Error" }, { status: 500 });
  }
}