"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingCourses, setPendingCourses] = useState<
    { id: string; title: string; instructor: { name: string }; createdAt: string }[]
  >([]);
  const [pendingUsers, setPendingUsers] = useState<
    { id: string; name: string; email: string; role: string; createdAt: string }[]
  >([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const user = session?.user;

  // Fetch admin notifications
  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    const fetchNotifs = () => {
      fetch("/api/admin/notifications")
        .then((r) => r.json())
        .then((data) => {
          setPendingCount(data.pendingCount || 0);
          setPendingCourses(data.pendingCourses || []);
          setPendingUsers(data.pendingUsers || []);
        })
        .catch(() => {});
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [user?.role]);

  // Close notification dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/logo.png"
              alt="Splash Academy"
              width={40}
              height={40}
              className="rounded-full group-hover:shadow-lg group-hover:shadow-primary/25 transition-all duration-200"
            />
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
                {user.role === "ADMIN" && (
                  <div ref={notifRef} className="relative ml-2">
                    <button
                      onClick={() => setNotifOpen(!notifOpen)}
                      className="relative p-2 rounded-lg hover:bg-muted transition"
                    >
                      <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      {pendingCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-danger text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                          {pendingCount}
                        </span>
                      )}
                    </button>

                    {notifOpen && (
                      <div className="absolute right-0 mt-2 w-80 bg-white border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
                        <div className="px-4 py-3 border-b border-border bg-muted/50">
                          <p className="font-semibold text-sm">Notifications</p>
                        </div>
                        {pendingCourses.length === 0 && pendingUsers.length === 0 ? (
                          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                            No pending items
                          </div>
                        ) : (
                          <div className="max-h-72 overflow-y-auto">
                            {pendingUsers.map((u) => (
                              <a
                                key={u.id}
                                href="/admin/users"
                                className="block px-4 py-3 hover:bg-muted/50 transition border-b border-border last:border-0"
                                onClick={() => setNotifOpen(false)}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium leading-snug">{u.name}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      New {u.role.toLowerCase()} — awaiting approval
                                    </p>
                                  </div>
                                </div>
                              </a>
                            ))}
                            {pendingCourses.map((course) => (
                              <a
                                key={course.id}
                                href="/admin/courses"
                                className="block px-4 py-3 hover:bg-muted/50 transition border-b border-border last:border-0"
                                onClick={() => setNotifOpen(false)}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 bg-warning/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <svg className="w-4 h-4 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium leading-snug">{course.title}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      by {course.instructor.name} — awaiting review
                                    </p>
                                  </div>
                                </div>
                              </a>
                            ))}
                          </div>
                        )}
                        <div className="flex border-t border-border">
                          <a
                            href="/admin/courses"
                            className="flex-1 px-4 py-2.5 text-center text-sm text-primary font-medium bg-muted/30 hover:bg-muted transition border-r border-border"
                            onClick={() => setNotifOpen(false)}
                          >
                            Courses
                          </a>
                          <a
                            href="/admin/users"
                            className="flex-1 px-4 py-2.5 text-center text-sm text-primary font-medium bg-muted/30 hover:bg-muted transition"
                            onClick={() => setNotifOpen(false)}
                          >
                            Users
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
                {user.role === "ADMIN" && pendingCount > 0 && (
                  <a
                    href="/admin/courses"
                    className="flex items-center gap-3 px-3 py-2.5 bg-warning/10 rounded-lg"
                    onClick={() => setMenuOpen(false)}
                  >
                    <svg className="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span className="text-sm font-medium text-warning">
                      {pendingCount} course{pendingCount !== 1 ? "s" : ""} awaiting review
                    </span>
                  </a>
                )}
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
