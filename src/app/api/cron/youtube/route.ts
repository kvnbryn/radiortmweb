import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Fungsi Helper buat nge-ekstrak Channel ID / Handle dari Link YouTube
async function getYouTubeChannelId(link: string, apiKey: string): Promise<string | null> {
  if (!link) return null;
  
  // Jika link format standard: youtube.com/channel/UC...
  const channelMatch = link.match(/channel\/(UC[\w-]+)/);
  if (channelMatch) return channelMatch[1];

  // Jika link format handle: youtube.com/@NamaChannel
  const handleMatch = link.match(/@([\w-]+)/);
  if (handleMatch) {
    const handle = handleMatch[1];
    try {
      // Panggil YouTube Search API buat nyari ID Channel dari handle tersebut
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=%40${handle}&key=${apiKey}`);
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        return data.items[0].snippet.channelId;
      }
    } catch (e) {
      console.error("Gagal resolve handle YouTube", e);
    }
  }

  // Jika link berupa username lama: youtube.com/user/nama
  const userMatch = link.match(/user\/([\w-]+)/);
  if (userMatch) {
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=id&forUsername=${userMatch[1]}&key=${apiKey}`);
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        return data.items[0].id;
      }
    } catch (e) {
      console.error("Gagal resolve username YouTube", e);
    }
  }

  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    // 1. Validasi Secret Key dari file .env
    const CRON_SECRET = process.env.CRON_SECRET;
    if (!CRON_SECRET || secret !== CRON_SECRET) {
      return NextResponse.json({ success: false, message: "Unauthorized: Secret Key Salah" }, { status: 401 });
    }

    // 2. Ambil Pengaturan YouTube Dinamis dari Database
    const setting = await prisma.setting.findFirst();
    if (!setting || !setting.youtubeApiKey || !setting.youtubeChannelLink) {
      return NextResponse.json({ 
        success: false, 
        message: "Konfigurasi YouTube belum disetting di Admin Panel" 
      }, { status: 500 });
    }

    const apiKey = setting.youtubeApiKey;
    const channelLink = setting.youtubeChannelLink;
    const categoryIdTarget = setting.youtubeCategoryId;

    // 3. Ekstrak Channel ID dari Link
    const channelId = await getYouTubeChannelId(channelLink, apiKey);
    if (!channelId) {
      return NextResponse.json({ 
        success: false, 
        message: "Gagal mendeteksi Channel ID dari link YouTube yang diberikan" 
      }, { status: 400 });
    }

    // 4. PERBAIKAN: Reset HANYA siaran otomatis yang dibikin cron (ada tanda &auto=true)
    await prisma.tvChannel.updateMany({
      where: { 
        streamType: "YOUTUBE", 
        status: "LIVE",
        url: { endsWith: "&auto=true" } // Filter khusus, siaran manual lu aman!
      },
      data: { status: "OFFLINE" }
    });

    // 5. Cek Siaran LIVE via YouTube API
    const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&eventType=live&key=${apiKey}`;
    const response = await fetch(ytUrl);
    const data = await response.json();

    if (data.error) {
      return NextResponse.json({ success: false, message: "YouTube API Error", detail: data.error }, { status: 500 });
    }

    // 6. Kalau tidak ada yang Live
    if (!data.items || data.items.length === 0) {
      return NextResponse.json({ success: true, message: "Channel sedang tidak live. Sistem robot direset ke OFFLINE." });
    }

    // 7. Kalau ada Live, ekstrak data
    const liveVideo = data.items[0];
    const videoId = liveVideo.id.videoId;
    const title = liveVideo.snippet.title;
    const description = liveVideo.snippet.description;
    const thumbnailUrl = liveVideo.snippet.thumbnails?.high?.url || "";
    
    // PERBAIKAN: Tambahin tanda &auto=true di ujung URL
    const streamUrl = `https://www.youtube.com/watch?v=${videoId}&auto=true`;
    
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + videoId;

    // Tentukan Kategori dengan tipe data Number yang pasti
    let finalCategoryId: number = 1; 

    if (categoryIdTarget && categoryIdTarget > 0) {
      finalCategoryId = categoryIdTarget;
    } else {
      const defaultCat = await prisma.category.findFirst();
      if (defaultCat) {
        finalCategoryId = defaultCat.id;
      }
    }

    // 8. Simpan atau Update di Database
    const existingStream = await prisma.tvChannel.findFirst({
      where: { url: streamUrl }
    });

    if (existingStream) {
      await prisma.tvChannel.update({
        where: { id: existingStream.id },
        data: { 
          status: "LIVE", 
          name: title, 
          thumbnail: thumbnailUrl,
          description: description || existingStream.description,
          categoryId: finalCategoryId 
        }
      });
      return NextResponse.json({ success: true, message: "Siaran live robot sudah ada, berhasil di-update ke LIVE di kategori yang dipilih!" });
    } else {
      await prisma.tvChannel.create({
        data: {
          name: title,
          slug: slug,
          description: description || "Siaran otomatis dari YouTube Live",
          url: streamUrl, // URL udah ada tanda &auto=true nya
          thumbnail: thumbnailUrl,
          status: "LIVE",
          streamType: "YOUTUBE",
          viewers: 0,
          resolution: "1080p", 
          categoryId: finalCategoryId, 
        }
      });
      return NextResponse.json({ success: true, message: "Berhasil mempublikasikan siaran live robot baru ke kategori pilihan!" });
    }

  } catch (error: any) {
    console.error("Cron Auto-Post Error:", error);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan server", error: error.message }, { status: 500 });
  }
}