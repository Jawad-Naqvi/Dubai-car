"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { toast } from "sonner";
import { Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
}

function Stars({
  value,
  onSelect,
  size = "h-3.5 w-3.5",
}: {
  value: number;
  onSelect?: (v: number) => void;
  size?: string;
}) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onSelect}
          onClick={() => onSelect?.(n)}
          className={cn(!onSelect && "cursor-default")}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          <Star
            className={cn(
              size,
              n <= value
                ? "fill-[#F0941F] text-[#F0941F]"
                : "text-[#D8D4C6]",
            )}
          />
        </button>
      ))}
    </span>
  );
}

/**
 * Dealer reviews: real data from `dealer_reviews`. Signed-in buyers can post a
 * review; the dealer's aggregate rating recomputes server-side on submit.
 */
export function ReviewsSection({ slug }: { slug: string }) {
  const { isSignedIn } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/dealers/${slug}/reviews`)
      .then((r) => r.json())
      .then((d) => !cancelled && setReviews(d.reviews ?? []))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`/api/dealers/${slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, title, body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      setReviews(data.reviews ?? []);
      setTitle("");
      setBody("");
      setRating(5);
      toast.success("Review posted — thank you!");
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Could not post review");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="py-8 border-t border-[#E7E4DA]">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">
          Reviews
          {reviews.length > 0 && (
            <span className="ml-2 text-base font-normal text-muted">
              ({reviews.length})
            </span>
          )}
        </h2>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          {/* List */}
          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-muted">Loading reviews…</p>
            ) : reviews.length === 0 ? (
              <p className="text-sm text-muted">
                No reviews yet. Be the first to review this dealer.
              </p>
            ) : (
              reviews.map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl bg-white border border-[#E7E4DA] shadow-card p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{r.authorName}</span>
                    <Stars value={r.rating} />
                  </div>
                  {r.title && (
                    <p className="mt-1.5 text-sm font-medium">{r.title}</p>
                  )}
                  {r.body && (
                    <p className="mt-1 text-xs text-secondary leading-relaxed">
                      {r.body}
                    </p>
                  )}
                  <p className="mt-2 text-[10px] text-muted">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Write form */}
          <div className="rounded-2xl bg-white border border-[#E7E4DA] shadow-card p-4 h-fit lg:sticky lg:top-16">
            <h3 className="text-sm font-semibold">Write a review</h3>
            {isSignedIn ? (
              <form onSubmit={submit} className="mt-3 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-secondary">Rating</span>
                  <Stars value={rating} onSelect={setRating} size="h-5 w-5" />
                </div>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title (optional)"
                  maxLength={160}
                  className="w-full h-9 rounded-lg border border-[#E5E5E5] px-3 text-sm focus:outline-none focus:border-[#C8A93E]"
                />
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Share your experience with this dealer…"
                  rows={4}
                  maxLength={4000}
                  className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:border-[#C8A93E] resize-none"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full h-9 rounded-lg bg-[#141414] text-white text-xs font-semibold hover:bg-[#141414]/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Post review"}
                </button>
              </form>
            ) : (
              <p className="mt-2 text-xs text-secondary">
                <Link
                  href="/sign-in"
                  className="text-[#A98F2E] font-semibold hover:underline"
                >
                  Sign in
                </Link>{" "}
                to write a review.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
