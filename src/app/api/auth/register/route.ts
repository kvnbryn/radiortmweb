import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, role } = body;

    // 1. Validasi input: Pastikan semua kolom terisi
    if (!username || !email || !password) {
      return NextResponse.json({ 
        success: false, 
        message: "Username, email, dan password wajib diisi!" 
      }, { status: 400 });
    }

    // 2. Cek apakah Email atau Username sudah dipakai orang lain
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { username: username }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json({ 
        success: false, 
        message: "Email atau Username sudah terdaftar, gunakan yang lain." 
      }, { status: 409 });
    }

    // 3. Enkripsi (Hash) Password biar aman dari hacker
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Simpan User baru ke Database MySQL
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        // Secara default role-nya USER, kecuali di-set eksplisit saat API dipanggil
        role: role || "USER", 
      },
      // Jangan kembalikan password di response demi keamanan
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: newUser,
      message: "Pendaftaran berhasil! Silakan login." 
    }, { status: 201 });

  } catch (error) {
    console.error("Error saat Register:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Terjadi kesalahan pada server saat pendaftaran." 
    }, { status: 500 });
  }
}