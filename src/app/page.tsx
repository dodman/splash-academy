import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import LoggedInHome from "@/components/LoggedInHome";

export default async function HomePage() {
  const session = await auth();
  const isLoggedIn = !!session?.user?.id;

  const courseCount = await db.course.count({
    where: { status: "PUBLISHED" },
  });
  const categoryCount = await db.category.count();
  const studentCount = await db.user.count({
    where: { role: "STUDENT" },
  });

  return (
    <>
      {/* Logged-in dashboard tabs */}
      {isLoggedIn && <LoggedInHome />}

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#4c1d95] via-primary-dark to-[#1e1b4b] text-white">
        {/* Ambient glow blobs */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute -top-20 -left-16 w-96 h-96 bg-primary-light rounded-full blur-[120px] animate-float-slow" />
          <div className="absolute top-1/3 -right-10 w-[28rem] h-[28rem] bg-accent-2/50 rounded-full blur-[130px] animate-float" />
          <div className="absolute -bottom-24 left-1/3 w-96 h-96 bg-accent rounded-full blur-[120px]" />
        </div>
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-grid opacity-60" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-40">
          <div className="max-w-3xl animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-2 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-2" />
              </span>
              Now with Splash AI — your personal study tutor
            </span>
            <h1 className="mt-6 text-4xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight">
              Master new skills with{" "}
              <span className="gradient-text">expert-led</span> courses
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-white/75 leading-relaxed max-w-2xl">
              High-quality courses in web development, design, and business —
              plus an AI tutor, GPA tracker, and quizzes built to help you learn
              faster and go further.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                href="/courses"
                className="group inline-flex items-center justify-center gap-2 bg-white text-primary-dark px-8 py-3.5 rounded-xl font-semibold shadow-glow hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
              >
                Browse Courses
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              {!isLoggedIn && (
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center border border-white/25 bg-white/5 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-white/10 hover:border-white/40 transition-all duration-200 backdrop-blur"
                >
                  Get Started Free
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Curved divider */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-background [clip-path:ellipse(75%_100%_at_50%_100%)]" />
      </section>

      {/* Stats — floating glass cards overlapping the hero */}
      <section className="relative -mt-24 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { value: `${courseCount}+`, label: "Courses Available", cls: "animate-fade-in-delay-1" },
              { value: `${categoryCount}`, label: "Categories", cls: "animate-fade-in-delay-2" },
              { value: `${studentCount}+`, label: "Students Learning", cls: "animate-fade-in-delay-3" },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`glass rounded-2xl px-8 py-7 text-center shadow-lift card-hover ${stat.cls}`}
              >
                <p className="text-4xl font-bold gradient-text">{stat.value}</p>
                <p className="text-muted-foreground mt-2 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-center">How It Works</h2>
        <p className="text-muted-foreground text-center mt-3 max-w-lg mx-auto">
          Getting started is easy. Create an account, find a course, and start learning at your own pace.
        </p>
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            {
              step: "1",
              title: "Sign Up",
              desc: "Create your free account and join the community.",
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              ),
            },
            {
              step: "2",
              title: "Enroll in Courses",
              desc: "Browse courses and enroll in the ones that interest you.",
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              ),
            },
            {
              step: "3",
              title: "Start Learning",
              desc: "Watch video lessons and track your progress as you learn.",
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
            },
          ].map((item) => (
            <div
              key={item.step}
              className="group relative rounded-2xl border border-border bg-card p-8 shadow-soft card-hover"
            >
              <span className="absolute right-6 top-6 text-5xl font-bold text-primary/5 select-none">
                {item.step}
              </span>
              <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent text-white rounded-2xl flex items-center justify-center shadow-glow transition-transform duration-300 group-hover:scale-110">
                {item.icon}
              </div>
              <h3 className="mt-6 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-dark to-[#1e1b4b] px-8 py-16 sm:py-20 text-center text-white shadow-glow">
          <div className="absolute inset-0 opacity-40">
            <div className="absolute -top-16 -right-10 w-80 h-80 bg-accent-2/40 rounded-full blur-[110px]" />
            <div className="absolute -bottom-20 -left-10 w-80 h-80 bg-primary-light/50 rounded-full blur-[110px]" />
          </div>
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold">
              {isLoggedIn ? "Continue your learning journey" : "Ready to start learning?"}
            </h2>
            <p className="mt-4 text-white/75 text-lg max-w-md mx-auto">
              {isLoggedIn
                ? "Explore more courses and keep building your skills."
                : "Join Splash Academy today and start your learning journey."}
            </p>
            <Link
              href={isLoggedIn ? "/courses" : "/signup"}
              className="inline-flex items-center gap-2 mt-8 bg-white text-primary-dark px-10 py-3.5 rounded-xl font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
            >
              {isLoggedIn ? "Browse Courses" : "Get Started Free"}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-glow">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="font-bold text-foreground">Splash Academy</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/courses" className="hover:text-foreground transition">Courses</Link>
              {!isLoggedIn && (
                <>
                  <Link href="/signup" className="hover:text-foreground transition">Sign Up</Link>
                  <Link href="/login" className="hover:text-foreground transition">Login</Link>
                </>
              )}
              {isLoggedIn && (
                <Link href="/profile" className="hover:text-foreground transition">Profile</Link>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; 2026 Splash Academy
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
