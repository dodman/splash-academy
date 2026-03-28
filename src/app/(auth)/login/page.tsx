"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [unverified, setUnverified] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendVerifyUrl, setResendVerifyUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setUnverified(false);
    setResendMessage("");
    setResendVerifyUrl(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      if (result.error.includes("EMAIL_NOT_VERIFIED")) {
        setUnverified(true);
        setError("Please verify your email before logging in.");
        return;
      }
      setError("Invalid email or password");
      return;
    }

    router.push("/");
    router.refresh();
  };

  const handleResendVerification = async () => {
    setResending(true);
    setResendMessage("");
    setResendVerifyUrl(null);

    try {
      const res = await fetch("/api/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setResendMessage(data.message || "Verification email sent!");
      if (data.verifyUrl) setResendVerifyUrl(data.verifyUrl);
    } catch {
      setResendMessage("Failed to resend. Please try again.");
    }

    setResending(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground mt-1">
            Log in to your Splash Academy account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-danger/10 text-danger text-sm px-4 py-3 rounded-lg">
              {error}
              {unverified && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resending}
                    className="text-primary hover:underline font-medium text-sm"
                  >
                    {resending ? "Sending..." : "Resend verification email"}
                  </button>
                </div>
              )}
            </div>
          )}

          {resendMessage && (
            <div className="bg-success/10 text-success text-sm px-4 py-3 rounded-lg">
              {resendMessage}
              {resendVerifyUrl && (
                <div className="mt-2 p-2 bg-blue-50 rounded">
                  <p className="text-xs text-blue-600 font-medium mb-1">Dev mode — click to verify:</p>
                  <a href={resendVerifyUrl} className="text-xs text-blue-700 underline break-all">
                    {resendVerifyUrl}
                  </a>
                </div>
              )}
            </div>
          )}

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
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              placeholder="Your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary-dark transition disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>

        {/* Demo accounts */}
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Demo Accounts:
          </p>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Admin: admin@splashacademy.com / admin123</p>
            <p>Instructor: instructor@splashacademy.com / instructor123</p>
            <p>Student: student@splashacademy.com / student123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
