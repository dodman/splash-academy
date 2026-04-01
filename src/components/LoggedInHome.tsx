"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";

type Tab = "favorites" | "search" | "learning" | "wishlist" | "account";

interface CourseData {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  thumbnail: string | null;
  instructor: { name: string };
  category: { name: string };
}

interface EnrollmentData {
  id: string;
  courseId: string;
  course: CourseData & {
    sections: { lessons: { id: string }[] }[];
  };
  totalLessons: number;
  completedLessons: number;
  progress: number;
  lastLessonId: string | null;
}

interface CategoryData {
  id: string;
  name: string;
  slug: string;
}

interface LessonResult {
  id: string;
  title: string;
  section: { course: { title: string; slug: string } };
}

export default function LoggedInHome() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>("search");

  const tabs: { key: Tab; label: string; icon: ReactNode }[] = [
    {
      key: "search",
      label: "Search",
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
    },
    {
      key: "account",
      label: "Account",
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    },
    {
      key: "learning",
      label: "My Learning",
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
    },
    {
      key: "favorites",
      label: "Favorites",
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
    },
    {
      key: "wishlist",
      label: "Wishlist",
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Welcome back, {session?.user?.name}!</h1>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-border overflow-x-auto pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-6 animate-fade-in">
        {activeTab === "favorites" && <FavoritesTab />}
        {activeTab === "search" && <SearchTab />}
        {activeTab === "learning" && <LearningTab />}
        {activeTab === "wishlist" && <WishlistTab />}
        {activeTab === "account" && <AccountTab />}
      </div>
    </div>
  );
}

// ─── COURSE CARD (reusable) ──────────────────────────

function CourseCard({ course, actions }: { course: CourseData; actions?: ReactNode }) {
  return (
    <div className="border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 bg-white">
      <Link href={`/courses/${course.slug}`}>
        <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <span className="text-primary/30 text-3xl font-bold">{course.title[0]}</span>
        </div>
      </Link>
      <div className="p-4">
        <Link href={`/courses/${course.slug}`}>
          <h3 className="font-semibold hover:text-primary transition line-clamp-2">{course.title}</h3>
        </Link>
        <p className="text-xs text-muted-foreground mt-1">{course.instructor.name} &middot; {course.category.name}</p>
        <p className="text-sm font-semibold text-primary mt-2">
          {course.price === 0 ? "Free" : `$${course.price}`}
        </p>
        {actions && <div className="mt-3 pt-3 border-t border-border">{actions}</div>}
      </div>
    </div>
  );
}

// ─── FAVORITES TAB ───────────────────────────────────

function FavoritesTab() {
  const [favorites, setFavorites] = useState<{ id: string; course: CourseData }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/favorites").then(r => r.json()).then(data => {
      setFavorites(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  const removeFavorite = async (courseId: string) => {
    await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    });
    setFavorites(prev => prev.filter(f => f.course.id !== courseId));
  };

  if (loading) return <LoadingSkeleton />;

  if (favorites.length === 0) {
    return (
      <EmptyState
        icon={<svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
        title="No favorites yet"
        description="Browse courses and click the heart icon to add them to your favorites."
        actionLabel="Browse Courses"
        actionHref="/courses"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {favorites.map((fav) => (
        <CourseCard
          key={fav.id}
          course={fav.course}
          actions={
            <button
              onClick={() => removeFavorite(fav.course.id)}
              className="text-xs text-danger hover:underline"
            >
              Remove from favorites
            </button>
          }
        />
      ))}
    </div>
  );
}

// ─── SEARCH TAB ──────────────────────────────────────

function SearchTab() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    courses: CourseData[];
    categories: CategoryData[];
    lessons: LessonResult[];
  }>({ courses: [], categories: [], lessons: [] });
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (query.trim().length < 2) return;
    setSearching(true);
    setSearched(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
    const data = await res.json();
    setResults(data);
    setSearching(false);
  };

  const totalResults = results.courses.length + results.categories.length + results.lessons.length;

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search courses, schools, or lessons..."
          className="flex-1 px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
        />
        <button
          onClick={handleSearch}
          disabled={searching || query.trim().length < 2}
          className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition disabled:opacity-50"
        >
          {searching ? "..." : "Search"}
        </button>
      </div>

      {searched && !searching && (
        <div className="mt-6">
          {totalResults === 0 ? (
            <p className="text-center text-muted-foreground py-8">No results found for &quot;{query}&quot;</p>
          ) : (
            <div className="space-y-6">
              {results.categories.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3">SCHOOLS ({results.categories.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {results.categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/courses?category=${cat.slug}`}
                        className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {results.courses.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3">COURSES ({results.courses.length})</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.courses.map((course) => (
                      <CourseCard key={course.id} course={course} />
                    ))}
                  </div>
                </div>
              )}

              {results.lessons.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3">LESSONS ({results.lessons.length})</h3>
                  <div className="space-y-2">
                    {results.lessons.map((lesson) => (
                      <Link
                        key={lesson.id}
                        href={`/courses/${lesson.section.course.slug}`}
                        className="block p-3 border border-border rounded-lg hover:bg-muted/50 transition"
                      >
                        <p className="font-medium text-sm">{lesson.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">in {lesson.section.course.title}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MY LEARNING TAB ─────────────────────────────────

function LearningTab() {
  const [enrollments, setEnrollments] = useState<EnrollmentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/enrollments").then(r => r.json()).then(data => {
      setEnrollments(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton />;

  if (enrollments.length === 0) {
    return (
      <EmptyState
        icon={<svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
        title="No courses yet"
        description="You haven't enrolled in any courses. Start exploring!"
        actionLabel="Browse Courses"
        actionHref="/courses"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {enrollments.map((enrollment) => (
        <Link
          key={enrollment.id}
          href={enrollment.lastLessonId
            ? `/courses/${enrollment.course.slug}/learn/${enrollment.lastLessonId}`
            : `/courses/${enrollment.course.slug}`
          }
          className="border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 bg-white group"
        >
          <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <span className="text-primary/30 text-3xl font-bold">{enrollment.course.title[0]}</span>
          </div>
          <div className="p-4">
            <h3 className="font-semibold group-hover:text-primary transition line-clamp-2">{enrollment.course.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{enrollment.course.instructor.name}</p>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span className="font-medium">{enrollment.progress}% complete</span>
                <span>{enrollment.completedLessons}/{enrollment.totalLessons} lessons</span>
              </div>
              <div className="w-full bg-border rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${enrollment.progress === 100 ? "bg-success" : "bg-primary"}`}
                  style={{ width: `${enrollment.progress}%` }}
                />
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── WISHLIST TAB ────────────────────────────────────

function WishlistTab() {
  const [wishlist, setWishlist] = useState<{ id: string; course: CourseData }[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/wishlist").then(r => r.json()),
      fetch("/api/categories").then(r => r.json()),
    ]).then(([wl, cats]) => {
      setWishlist(Array.isArray(wl) ? wl : []);
      setCategories(Array.isArray(cats) ? cats : []);
      setLoading(false);
    });
  }, []);

  const removeFromWishlist = async (courseId: string) => {
    await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    });
    setWishlist(prev => prev.filter(w => w.course.id !== courseId));
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div>
      {/* Schools browser */}
      <div className="mb-8">
        <h3 className="font-semibold text-lg mb-3">Browse by School</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/courses?category=${cat.slug}`}
              className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Wishlist items */}
      {wishlist.length === 0 ? (
        <EmptyState
          icon={<svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>}
          title="Your wishlist is empty"
          description="Browse schools above and add courses you'd like to take later."
          actionLabel="Browse Courses"
          actionHref="/courses"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((item) => (
            <CourseCard
              key={item.id}
              course={item.course}
              actions={
                <button
                  onClick={() => removeFromWishlist(item.course.id)}
                  className="text-xs text-danger hover:underline"
                >
                  Remove from wishlist
                </button>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ACCOUNT TAB ─────────────────────────────────────

function AccountTab() {
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSubject, setReportSubject] = useState("");
  const [reportMessage, setReportMessage] = useState("");
  const [reportStatus, setReportStatus] = useState<"" | "sending" | "sent" | "error">("");
  const [careerGoal, setCareerGoal] = useState("");
  const [careerGoalSaved, setCareerGoalSaved] = useState(false);
  const [enrollmentCount, setEnrollmentCount] = useState(0);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    fetch("/api/profile").then(r => r.json()).then(data => {
      if (data.careerGoal) setCareerGoal(data.careerGoal);
    });
    fetch("/api/student/enrollments").then(r => r.json()).then(data => {
      if (Array.isArray(data)) setEnrollmentCount(data.length);
    }).catch(() => {});
  }, []);

  const saveCareerGoal = async () => {
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: undefined, careerGoal }),
    });
    // Need name for the PUT, fetch it first
    const profileRes = await fetch("/api/profile");
    const profile = await profileRes.json();
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: profile.name, careerGoal }),
    });
    setCareerGoalSaved(true);
    setTimeout(() => setCareerGoalSaved(false), 2000);
  };

  const submitReport = async () => {
    if (!reportSubject.trim() || !reportMessage.trim()) return;
    setReportStatus("sending");
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: reportSubject, message: reportMessage }),
    });
    if (res.ok) {
      setReportStatus("sent");
      setReportSubject("");
      setReportMessage("");
      setTimeout(() => { setReportStatus(""); setReportOpen(false); }, 2000);
    } else {
      setReportStatus("error");
    }
  };

  const closeAccount = async () => {
    if (!confirm("Are you sure you want to close your account? This action cannot be undone.")) return;
    if (!confirm("This will permanently delete all your data. Are you absolutely sure?")) return;
    setClosing(true);
    const res = await fetch("/api/close-account", { method: "DELETE" });
    if (res.ok) {
      signOut({ callbackUrl: "/" });
    } else {
      const data = await res.json();
      alert(data.error || "Failed to close account");
      setClosing(false);
    }
  };

  const menuItems = [
    {
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      label: "Video playback",
      desc: "Auto-play next lesson is enabled",
      type: "info" as const,
    },
    {
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
      label: "Courses enrolled",
      desc: `${enrollmentCount} course${enrollmentCount !== 1 ? "s" : ""}`,
      type: "info" as const,
    },
    {
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>,
      label: "Subscriptions",
      desc: "Free plan",
      type: "info" as const,
    },
  ];

  return (
    <div className="max-w-2xl space-y-4">
      {/* Menu items */}
      {menuItems.map((item, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border border-border rounded-xl">
          <div className="text-muted-foreground">{item.icon}</div>
          <div className="flex-1">
            <p className="font-medium text-sm">{item.label}</p>
            <p className="text-xs text-muted-foreground">{item.desc}</p>
          </div>
        </div>
      ))}

      {/* Career Goal */}
      <div className="p-4 border border-border rounded-xl">
        <div className="flex items-center gap-4">
          <div className="text-muted-foreground">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">Career goal</p>
            <input
              type="text"
              value={careerGoal}
              onChange={(e) => setCareerGoal(e.target.value)}
              placeholder="e.g., Become a full-stack developer"
              className="w-full mt-2 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
        <div className="flex justify-end mt-2">
          <button onClick={saveCareerGoal} className="text-xs text-primary hover:underline font-medium">
            {careerGoalSaved ? "Saved!" : "Save"}
          </button>
        </div>
      </div>

      {/* About Splash Academy */}
      <div className="p-4 border border-border rounded-xl">
        <div className="flex items-center gap-4">
          <div className="text-muted-foreground">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="font-medium text-sm">About Splash Academy</p>
            <p className="text-xs text-muted-foreground mt-1">
              Splash Academy is an online learning platform offering courses across multiple schools.
              Learn at your own pace with expert instructors.
            </p>
          </div>
        </div>
      </div>

      {/* Help and Support */}
      <div className="p-4 border border-border rounded-xl">
        <div className="flex items-center gap-4">
          <div className="text-muted-foreground">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="font-medium text-sm">Help and support</p>
            <p className="text-xs text-muted-foreground mt-1">
              Need help? Browse courses, check your enrollment status, or report a problem below.
            </p>
          </div>
        </div>
      </div>

      {/* Report a Problem */}
      <div className="p-4 border border-border rounded-xl">
        <button
          onClick={() => setReportOpen(!reportOpen)}
          className="flex items-center gap-4 w-full text-left"
        >
          <div className="text-muted-foreground">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">Report a problem</p>
            <p className="text-xs text-muted-foreground">Let us know about any issues you encounter</p>
          </div>
          <svg className={`w-4 h-4 text-muted-foreground transition ${reportOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
        {reportOpen && (
          <div className="mt-4 space-y-3">
            <input
              type="text"
              value={reportSubject}
              onChange={(e) => setReportSubject(e.target.value)}
              placeholder="Subject"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <textarea
              value={reportMessage}
              onChange={(e) => setReportMessage(e.target.value)}
              placeholder="Describe the problem..."
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
            <button
              onClick={submitReport}
              disabled={reportStatus === "sending" || !reportSubject.trim() || !reportMessage.trim()}
              className="w-full bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition disabled:opacity-50"
            >
              {reportStatus === "sending" ? "Submitting..." : reportStatus === "sent" ? "Report Submitted!" : "Submit Report"}
            </button>
            {reportStatus === "error" && (
              <p className="text-xs text-danger">Failed to submit report. Please try again.</p>
            )}
          </div>
        )}
      </div>

      {/* Close Account */}
      <div className="p-4 border border-danger/30 rounded-xl">
        <button
          onClick={closeAccount}
          disabled={closing}
          className="flex items-center gap-4 w-full text-left"
        >
          <div className="text-danger">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </div>
          <div>
            <p className="font-medium text-sm text-danger">{closing ? "Closing account..." : "Close account"}</p>
            <p className="text-xs text-muted-foreground">Permanently delete your account and all data</p>
          </div>
        </button>
      </div>
    </div>
  );
}

// ─── SHARED COMPONENTS ───────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="border border-border rounded-xl overflow-hidden animate-pulse">
          <div className="h-32 bg-muted" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon, title, description, actionLabel, actionHref }: {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-1">{description}</p>
      <Link
        href={actionHref}
        className="inline-block mt-6 bg-primary text-white px-8 py-3 rounded-xl font-semibold hover:bg-primary-dark transition"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
