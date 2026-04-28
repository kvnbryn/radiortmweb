// src/app/api/auth/login/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || "visionstream_rahasia_super_aman_123");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ success: false, message: "Username & Password wajib diisi" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      return NextResponse.json({ success: false, message: "Akun tidak ditemukan" }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ success: false, message: "Password salah!" }, { status: 401 });
    }

    // Buat Token JWT
    const token = await new SignJWT({ 
      id: user.id, 
      username: user.username,
      role: user.role 
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(SECRET_KEY);

    const response = NextResponse.json({ 
      success: true, 
      message: "Berhasil masuk",
      role: user.role 
    }, { status: 200 });

    // SETTING COOKIE KHUSUS VPS NON-SSL (HTTP)
    response.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure: false, // DIPAKSA FALSE KARENA VPS BELUM SSL/HTTPS
      sameSite: "lax", // Lax paling aman buat environment IP address
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return response;

  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
  }
}