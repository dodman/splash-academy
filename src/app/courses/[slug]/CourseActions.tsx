"use client";

import { useState, useEffect } from "react";

interface Props {
  courseId: string;
  isLoggedIn: boolean;
}

export default function CourseActions({ courseId, isLoggedIn }: Props) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loading, setLoading] = useState<"fav" | "wish" | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    // Check current favorite/wishlist status
    Promise.all([
      fetch("/api/favorites").then((r) => r.json()),
      fetch("/api/wishlist").then((r) => r.json()),
    ]).then(([favs, wishes]) => {
      if (Array.isArray(favs)) {
        setIsFavorite(favs.some((f: { courseId: string }) => f.courseId === courseId));
      }
      if (Array.isArray(wishes)) {
        setIsWishlisted(wishes.some((w: { courseId: string }) => w.courseId === courseId));
      }
    });
  }, [courseId, isLoggedIn]);

  const toggleFavorite = async () => {
    if (!isLoggedIn) return;
    setLoading("fav");
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    });
    if (res.ok) {
      const data = await res.json();
      setIsFavorite(data.status === "added");
    }
    setLoading(null);
  };

  const toggleWishlist = async () => {
    if (!isLoggedIn) return;
    setLoading("wish");
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    });
    if (res.ok) {
      const data = await res.json();
      setIsWishlisted(data.status === "added");
    }
    setLoading(null);
  };

  if (!isLoggedIn) return null;

  return (
    <div className="flex gap-2 mt-4">
      <button
        onClick={toggleFavorite}
        disabled={loading === "fav"}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${
          isFavorite
            ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
            : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        <svg
          className="w-5 h-5"
          fill={isFavorite ? "currentColor" : "none"}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        {isFavorite ? "Favorited" : "Favorite"}
      </button>

      <button
        onClick={toggleWishlist}
        disabled={loading === "wish"}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${
          isWishlisted
            ? "bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100"
            : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        <svg
          className="w-5 h-5"
          fill={isWishlisted ? "currentColor" : "none"}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
        {isWishlisted ? "Wishlisted" : "Wishlist"}
      </button>
    </div>
  );
}
