import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

// Pages that anonymous visitors are allowed to see.
const PUBLIC_PAGES = new Set<string>([
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
]);

// API endpoints that anonymous visitors are allowed to call.
// Anything else under /api/* requires a valid session.
const PUBLIC_API_PREFIXES = [
  "/api/auth",                  // NextAuth handlers
  "/api/signup",                // create account
  "/api/forgot-password",       // initiate password reset
  "/api/reset-password",        // complete password reset
  "/api/verify-email",          // verify email link
  "/api/resend-verification",   // resend verification email
  "/api/webhooks",              // Stripe webhooks (signed)
];

export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const user = req.auth?.user;

  // Always-allowed framework / static asset paths
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return NextResponse.next();
  }

  // Public pages and APIs
  const isPublicPage = PUBLIC_PAGES.has(pathname);
  const isPublicApi = PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p));

  if (isPublicPage || isPublicApi) {
    // If the user is already logged in, send them away from auth pages.
    if (user && isPublicPage) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // Everything else requires a session.
  if (!user) {
    // For API calls return JSON 401 instead of an HTML redirect
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Preserve the destination so we can return after login
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname + (search || ""));
    return NextResponse.redirect(loginUrl);
  }

  // Role-based route protection
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (user.role !== "ADMIN" && user.role !== "OVERALL_ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  if (pathname.startsWith("/instructor") || pathname.startsWith("/api/instructor")) {
    if (
      user.role !== "INSTRUCTOR" &&
      user.role !== "ADMIN" &&
      user.role !== "OVERALL_ADMIN"
    ) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
