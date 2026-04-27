"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/gpa", label: "Dashboard", exact: true },
  { href: "/gpa/add-course", label: "Add Course" },
  { href: "/gpa/courses", label: "Courses" },
  { href: "/gpa/forecast", label: "Forecast" },
  { href: "/gpa/ask-ai", label: "Ask AI" },
];

export default function GpaSubNav() {
  const pathname = usePathname();
  return (
    <div className="rico-nav-links">
      {LINKS.map((l) => {
        const isActive = l.exact ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={isActive ? "rico-nav-link active" : "rico-nav-link"}
          >
            {l.label}
          </Link>
        );
      })}
      <style>{`
        .rico-nav-links {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .rico-nav-link {
          color: #ccc;
          font-size: 0.9rem;
          text-decoration: none;
          padding: 4px 0;
          border-bottom: 2px solid transparent;
          transition: color 0.15s, border-color 0.15s;
        }
        .rico-nav-link:hover { color: #fff; text-decoration: none; }
        .rico-nav-link.active { color: #fff; border-bottom-color: #4361ee; }
        @media (max-width: 600px) {
          .rico-nav-links { gap: 10px; flex-wrap: wrap; }
          .rico-nav-link { font-size: 0.82rem; }
        }
      `}</style>
    </div>
  );
}
