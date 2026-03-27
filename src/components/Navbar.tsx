"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const user = session?.user;

  const getDashboardLink = () => {
    if (!user) return "/login";
    if (user.role === "ADMIN") return "/admin";
    if (user.role === "INSTRUCTOR") return "/instructor";
    return "/dashboard";
  };

  return (
    <nav className="bg-white/80 backdrop-blur-lg border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center group-hover:shadow-lg group-hover:shadow-primary/25 transition-all duration-200">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-xl font-bold text-foreground">
              Splash Academy
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/courses"
              className="text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium"
            >
              Browse Courses
            </Link>

            {user ? (
              <>
                <Link
                  href={getDashboardLink()}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium"
                >
                  Dashboard
                </Link>
                <div className="flex items-center gap-3 ml-3 pl-3 border-l border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary">
                        {user.name?.[0]?.toUpperCase() || "U"}
                      </span>
                    </div>
                    <div className="hidden lg:block">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{user.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-sm text-muted-foreground hover:text-danger px-2 py-1 rounded-lg hover:bg-danger/5 transition-all duration-200"
                  >
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 ml-3">
                <Link
                  href="/login"
                  className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="bg-primary text-white px-5 py-2.5 rounded-xl hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/25 transition-all duration-200 text-sm font-semibold"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted transition"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <div className="md:hidden pb-4 flex flex-col gap-1 animate-fade-in">
            <Link
              href="/courses"
              className="text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-2.5 rounded-lg transition"
              onClick={() => setMenuOpen(false)}
            >
              Browse Courses
            </Link>
            {user ? (
              <>
                <Link
                  href={getDashboardLink()}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-2.5 rounded-lg transition"
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <div className="flex items-center gap-2 px-3 py-2 mt-2 border-t border-border pt-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary">
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-left text-danger hover:bg-danger/5 px-3 py-2.5 rounded-lg transition"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-2.5 rounded-lg transition"
                  onClick={() => setMenuOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="bg-primary text-white px-4 py-2.5 rounded-xl text-center text-sm font-semibold mt-1"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
