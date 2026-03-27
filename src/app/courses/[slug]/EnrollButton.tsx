"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function EnrollButton({
  courseId,
  price,
}: {
  courseId: string;
  price: number;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleEnroll = async () => {
    if (!session) {
      router.push("/login");
      return;
    }

    setLoading(true);

    const res = await fetch(`/api/payments/checkout/${courseId}`, {
      method: "POST",
    });

    const data = await res.json();

    if (data.enrolled) {
      // Direct enrollment (free course or Stripe not configured)
      router.refresh();
    } else if (data.url) {
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } else {
      alert(data.error || "Failed to enroll");
    }

    setLoading(false);
  };

  return (
    <button
      onClick={handleEnroll}
      disabled={loading}
      className="mt-4 w-full bg-primary text-white py-3.5 rounded-xl font-semibold hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/25 transition-all duration-200 disabled:opacity-50 disabled:hover:shadow-none"
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Processing...
        </span>
      ) : price === 0 ? (
        "Enroll for Free"
      ) : (
        `Enroll — $${price.toFixed(2)}`
      )}
    </button>
  );
}
