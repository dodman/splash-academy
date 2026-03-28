import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;

  // Public routes — always accessible
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/courses") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/courses") ||
    pathname.startsWith("/api/categories") ||
    pathname.startsWith("/api/signup") ||
    pathname.startsWith("/api/search") ||
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Not logged in — redirect to login
  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Role-based route protection
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  if (pathname.startsWith("/instructor") || pathname.startsWith("/api/instructor")) {
    if (user.role !== "INSTRUCTOR" && user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
