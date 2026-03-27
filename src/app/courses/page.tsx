"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  thumbnail: string | null;
  instructor: { id: string; name: string };
  category: { id: string; name: string; slug: string };
  _count: { enrollments: number };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

function CourseCardSkeleton() {
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="h-44 skeleton" />
      <div className="p-5 space-y-3">
        <div className="h-4 w-20 skeleton" />
        <div className="h-5 w-full skeleton" />
        <div className="h-4 w-32 skeleton" />
        <div className="flex justify-between mt-4">
          <div className="h-6 w-16 skeleton" />
          <div className="h-4 w-20 skeleton" />
        </div>
      </div>
    </div>
  );
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (selectedCategory) params.set("category", selectedCategory);

    fetch(`/api/courses?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setCourses(data);
        setLoading(false);
      });
  }, [search, selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold">Browse Courses</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Find the perfect course for you
        </p>
      </div>

      {/* Filters */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4 animate-fade-in-delay-1">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white transition min-w-[180px]"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="mt-16 text-center animate-fade-in">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-muted-foreground mt-4 text-lg">No courses found.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, i) => (
            <Link
              key={course.id}
              href={`/courses/${course.slug}`}
              className="border border-border rounded-xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group bg-white"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="h-44 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative overflow-hidden">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <span className="text-primary/30 text-5xl font-bold">
                    {course.title[0]}
                  </span>
                )}
                {course.price === 0 && (
                  <span className="absolute top-3 right-3 bg-success text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                    Free
                  </span>
                )}
              </div>
              <div className="p-5">
                <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                  {course.category.name}
                </span>
                <h3 className="mt-3 font-semibold text-lg group-hover:text-primary transition line-clamp-2 leading-snug">
                  {course.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {course.instructor.name}
                </p>
                <div className="mt-4 flex items-center justify-between pt-4 border-t border-border">
                  <span className="font-bold text-xl">
                    {course.price === 0 ? "Free" : `$${course.price.toFixed(2)}`}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {course._count.enrollments} {course._count.enrollments === 1 ? "student" : "students"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
