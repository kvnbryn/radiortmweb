import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { jwtVerify } from "jose";

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || "visionstream_rahasia_super_aman_123");

export async function POST(request: NextRequest) {
  try {
    // 1. Ambil token dari cookie untuk tau siapa yang lagi login
    const token = request.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: "Akses ditolak. Sesi telah habis." }, { status: 401 });
    }

    // 2. Verifikasi token dan ambil ID User
    const { payload } = await jwtVerify(token, SECRET_KEY);
    const userId = payload.id as number;

    const body = await request.json();
    const { oldPassword, newPassword, confirmPassword } = body;

    // 3. Validasi input dasar
    if (!oldPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ success: false, message: "Semua kolom wajib diisi!" }, { status: 400 });
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ success: false, message: "Password baru dan konfirmasi tidak cocok!" }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ success: false, message: "Password baru minimal 6 karakter!" }, { status: 400 });
    }

    // 4. Cari user di database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "Pengguna tidak ditemukan." }, { status: 404 });
    }

    // 5. Cek apakah password lama yang dimasukkan itu benar
    const isOldPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordCorrect) {
      return NextResponse.json({ success: false, message: "Password lama salah!" }, { status: 401 });
    }

    // 6. Enkripsi password baru dan simpan ke database
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    return NextResponse.json({ success: true, message: "Password berhasil diperbarui!" }, { status: 200 });

  } catch (error) {
    console.error("Change Password Error:", error);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}