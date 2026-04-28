import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const settings = await prisma.setting.findFirst();
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      siteName, 
      seoDescription, 
      autoPlay, 
      isMaintenance, 
      logoUrl, 
      defaultThumbnail,
      termsContent,
      privacyContent,
      helpContent,
      youtubeApiKey,
      youtubeChannelLink,
      youtubeCategoryId
    } = body;

    const existing = await prisma.setting.findFirst();

    if (existing) {
      const updated = await prisma.setting.update({
        where: { id: existing.id },
        data: { 
          siteName, 
          seoDescription, 
          autoPlay, 
          isMaintenance, 
          logoUrl, 
          defaultThumbnail,
          termsContent,
          privacyContent,
          helpContent,
          youtubeApiKey,
          youtubeChannelLink,
          youtubeCategoryId
        }
      });
      return NextResponse.json({ success: true, data: updated });
    }

    const created = await prisma.setting.create({
      data: { 
        siteName, 
        seoDescription, 
        autoPlay, 
        isMaintenance, 
        logoUrl, 
        defaultThumbnail,
        termsContent,
        privacyContent,
        helpContent,
        youtubeApiKey,
        youtubeChannelLink,
        youtubeCategoryId
      }
    });
    return NextResponse.json({ success: true, data: created });

  } catch (error) {
    console.error("Settings API Error:", error);
    return NextResponse.json({ success: false, message: "Error" }, { status: 500 });
  }
}