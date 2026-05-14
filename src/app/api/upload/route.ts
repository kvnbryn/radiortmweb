import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
    }

    // Ambil IP VPS dari environment variable
    const vpsIp = process.env.VPS_IP || "141.11.25.59";
    
    // Siapkan data untuk dilempar ke VPS
    const forwardData = new FormData();
    forwardData.append("file", file);

    // Kirim ke script receiver di VPS
    const response = await fetch(`http://${vpsIp}:5000/upload-receiver`, {
      method: "POST",
      body: forwardData,
    });

    if (!response.ok) {
      throw new Error("Failed to forward file to VPS");
    }

    const result = await response.json();

    // PERBAIKAN: Tambahkan success: true agar dibaca benar oleh frontend
    return NextResponse.json({ 
      success: true,
      url: result.url 
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 });
  }
}