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
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-[#4c1d95] text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary-light rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="max-w-2xl animate-fade-in">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
              Learn new skills from expert instructors
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-white/80 leading-relaxed">
              Splash Academy offers high-quality courses in web development,
              design, business, and more. Start learning today.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                href="/courses"
                className="bg-white text-primary px-8 py-3.5 rounded-xl font-semibold text-center hover:bg-gray-100 hover:shadow-lg transition-all duration-200"
              >
                Browse Courses
              </Link>
              {!isLoggedIn && (
                <Link
                  href="/signup"
                  className="border-2 border-white/30 text-white px-8 py-3.5 rounded-xl font-semibold text-center hover:bg-white/10 hover:border-white/50 transition-all duration-200"
                >
                  Get Started Free
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div className="animate-fade-in-delay-1">
              <p className="text-4xl font-bold text-primary">{courseCount}+</p>
              <p className="text-muted-foreground mt-2 font-medium">Courses Available</p>
            </div>
            <div className="animate-fade-in-delay-2">
              <p className="text-4xl font-bold text-primary">{categoryCount}</p>
              <p className="text-muted-foreground mt-2 font-medium">Categories</p>
            </div>
            <div className="animate-fade-in-delay-3">
              <p className="text-4xl font-bold text-primary">{studentCount}+</p>
              <p className="text-muted-foreground mt-2 font-medium">Students Learning</p>
            </div>
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
            <div key={item.step} className="text-center group">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto group-hover:bg-primary group-hover:text-white transition-all duration-300">
                {item.icon}
              </div>
              <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-primary/5 to-primary-light/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-3xl font-bold">
            {isLoggedIn ? "Continue your learning journey" : "Ready to start learning?"}
          </h2>
          <p className="mt-3 text-muted-foreground text-lg max-w-md mx-auto">
            {isLoggedIn
              ? "Explore more courses and keep building your skills."
              : "Join Splash Academy today and start your learning journey."}
          </p>
          <Link
            href={isLoggedIn ? "/courses" : "/signup"}
            className="inline-block mt-8 bg-primary text-white px-10 py-3.5 rounded-xl font-semibold hover:bg-primary-dark hover:shadow-lg transition-all duration-200"
          >
            {isLoggedIn ? "Browse Courses" : "Get Started Free"}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
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
