// src/app/api/auth/logout/route.ts

import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json({ 
      success: true, 
      message: "Logout berhasil" 
    }, { status: 200 });

    // Hapus cookie dengan cara menset value kosong dan expires-nya menjadi 0
    response.cookies.set({
      name: "auth_token",
      value: "",
      httpOnly: true,
      expires: new Date(0),
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json({ success: false, message: "Gagal logout" }, { status: 500 });
  }
}