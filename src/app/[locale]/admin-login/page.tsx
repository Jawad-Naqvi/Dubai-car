"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, Link } from "@/i18n/routing";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/auth-shell";
import { Loader2, Lock, ArrowLeft } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const setDigit = (i: number, v: string) => {
    const d = v.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    if (d && i < 3) inputs.current[i + 1]?.focus();
    if (next.every((x) => x !== "")) submit(next.join(""));
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (text.length === 4) {
      setDigits(text.split(""));
      submit(text);
    }
  };

  const submit = async (pin: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (!res.ok) {
        toast.error("Incorrect PIN. Try again.");
        setDigits(["", "", "", ""]);
        inputs.current[0]?.focus();
        return;
      }
      toast.success("Welcome, admin");
      router.push("/admin");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Restricted access"
      quoteLines={["Admin", "Command", "Center"]}
      quoteSub="Moderate listings, approve sellers, and keep the marketplace trustworthy — all from one place."
      title="Admin Access"
      subtitle="Enter your 4-digit admin PIN to continue"
      footer={
        <Link
          href="/sign-in"
          className="inline-flex items-center gap-1.5 font-semibold text-[#141414] hover:text-[#C97612] transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to sign in
        </Link>
      }
    >
      <div className="flex items-center justify-center gap-3" onPaste={onPaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            value={d}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            inputMode="numeric"
            type="password"
            maxLength={1}
            disabled={loading}
            className="h-14 w-12 rounded-xl bg-[#F4F3F1] border border-transparent text-center text-2xl font-bold text-[#141414] focus:outline-none focus:border-[#141414]/20 focus:ring-2 focus:ring-[#141414]/10 disabled:opacity-50"
          />
        ))}
      </div>

      <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-muted">
        {loading ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" /> Verifying…
          </>
        ) : (
          <>
            <Lock className="h-3 w-3" /> Restricted area · admins only
          </>
        )}
      </div>
    </AuthShell>
  );
}
