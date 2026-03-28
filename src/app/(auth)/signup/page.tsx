"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      setLoading(false);
      return;
    }

    // If instructor account is pending approval
    if (data.pendingApproval) {
      setPendingApproval(true);
      if (data.verifyUrl) setVerifyUrl(data.verifyUrl);
      setLoading(false);
      return;
    }

    // Email verification needed
    if (data.needsVerification) {
      setNeedsVerification(true);
      if (data.verifyUrl) setVerifyUrl(data.verifyUrl);
      setLoading(false);
      return;
    }

    router.push("/login");
  };

  // Pending approval screen (instructor)
  if (pendingApproval) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Almost There!</h1>
          <p className="text-muted-foreground mt-3">
            Your instructor account has been created. Please verify your email first,
            then wait for admin approval before you can log in.
          </p>
          {verifyUrl && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600 font-medium mb-1">Dev mode — click to verify:</p>
              <a href={verifyUrl} className="text-sm text-blue-700 underline break-all">
                {verifyUrl}
              </a>
            </div>
          )}
          <Link
            href="/login"
            className="inline-block mt-6 text-primary hover:underline"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  // Email verification needed screen (student)
  if (needsVerification) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Check Your Email</h1>
          <p className="text-muted-foreground mt-3">
            We&apos;ve sent a verification link to <strong>{email}</strong>.
            Please click the link to verify your account before logging in.
          </p>
          {verifyUrl && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600 font-medium mb-1">Dev mode — click to verify:</p>
              <a href={verifyUrl} className="text-sm text-blue-700 underline break-all">
                {verifyUrl}
              </a>
            </div>
          )}
          <div className="mt-6 space-y-2">
            <Link
              href="/login"
              className="inline-block text-primary hover:underline font-medium"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground mt-1">
            Join Splash Academy as a student or instructor
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-danger/10 text-danger text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Role selector */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setRole("STUDENT")}
              className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition ${
                role === "STUDENT"
                  ? "bg-primary text-white border-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              I want to learn
            </button>
            <button
              type="button"
              onClick={() => setRole("INSTRUCTOR")}
              className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition ${
                role === "INSTRUCTOR"
                  ? "bg-primary text-white border-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              I want to teach
            </button>
          </div>

          {role === "INSTRUCTOR" && (
            <div className="bg-yellow-50 text-yellow-800 text-xs px-3 py-2 rounded-lg">
              Instructor accounts require admin approval before you can start teaching.
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              placeholder="At least 6 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary-dark transition disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
