import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "visionstream_rahasia_super_aman_123"
);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      const { payload } = await jwtVerify(token, SECRET_KEY);
      if (payload.role !== "ADMIN" && payload.role !== "SUPERADMIN") {
        return NextResponse.redirect(new URL("/", request.url));
      }
      return NextResponse.next();
    } catch (err) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("auth_token");
      return response;
    }
  }

  if (pathname === "/login" && token) {
    try {
      const { payload } = await jwtVerify(token, SECRET_KEY);
      if (payload.role === "ADMIN" || payload.role === "SUPERADMIN") {
        return NextResponse.redirect(new URL("/admin/tv", request.url));
      } else {
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch (err) {
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/admin", "/login"],
};