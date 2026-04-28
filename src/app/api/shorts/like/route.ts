import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shortId, identifier } = body;

    if (!shortId || !identifier) {
      return NextResponse.json({ success: false, message: "Missing parameter" }, { status: 400 });
    }

    // Cek apakah user sudah like video ini
    const existingLike = await prisma.shortLike.findUnique({
      where: {
        shortId_identifier: {
          shortId: parseInt(shortId),
          identifier: identifier
        }
      }
    });

    if (existingLike) {
      // Jika sudah ada, hapus (Unlike)
      await prisma.shortLike.delete({
        where: { id: existingLike.id }
      });
      return NextResponse.json({ success: true, action: "unliked" }, { status: 200 });
    } else {
      // Jika belum ada, buat baru (Like)
      await prisma.shortLike.create({
        data: {
          shortId: parseInt(shortId),
          identifier: identifier
        }
      });
      return NextResponse.json({ success: true, action: "liked" }, { status: 201 });
    }
  } catch (error) {
    console.error("Like error:", error);
    return NextResponse.json({ success: false, message: "Error" }, { status: 500 });
  }
}