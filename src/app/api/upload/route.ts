import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Ambil IP VPS dari environment variable
    const vpsIp = process.env.VPS_IP || "141.11.25.59";
    
    // Siapkan data untuk dilempar ke VPS
    const forwardData = new FormData();
    forwardData.append("file", file);

    // Kirim ke script receiver di VPS (Port 5000)
    const response = await fetch(`http://${vpsIp}:5000/upload-receiver`, {
      method: "POST",
      body: forwardData,
    });

    if (!response.ok) {
      throw new Error("Failed to forward file to VPS");
    }

    const result = await response.json();

    // Kembalikan path relatif (/uploads/...) ke Frontend
    return NextResponse.json({ 
      url: result.url 
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}