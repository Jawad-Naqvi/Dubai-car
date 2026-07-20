"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { RadialGlow, StarField } from "@/components/marketing/radial-glow";
import { brand } from "@/lib/brand";
import { ShieldCheck, Loader2, Lock } from "lucide-react";

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
    <div className="relative min-h-screen flex items-center justify-center px-6 py-16 overflow-hidden bg-page">
      <StarField />
      <RadialGlow color="gold" size="xl" className="-top-40 -right-40 opacity-30" />
      <RadialGlow color="emerald" size="lg" className="-bottom-40 -left-40 opacity-30" />

      <div className="relative w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-10 w-10 rounded-xl bg-[#141414] flex items-center justify-center text-white font-black text-sm">
            DXB
          </div>
          <span className="text-[#141414] font-bold text-xl">{brand.name}</span>
        </div>

        <div className="rounded-2xl bg-white shadow-card border border-[#E7E4DA] p-7 text-center">
          <div className="h-12 w-12 rounded-full bg-[#F0941F]/10 border border-[#F0941F]/30 grid place-items-center mx-auto">
            <ShieldCheck className="h-6 w-6 text-[#F0941F]" />
          </div>
          <h1 className="mt-4 text-base font-bold text-[#141414]">Admin access</h1>
          <p className="mt-1 text-xs text-muted">Enter your 4-digit admin PIN</p>

          <div
            className="mt-6 flex items-center justify-center gap-3"
            onPaste={onPaste}
          >
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
                className="h-14 w-12 rounded-xl bg-white border border-[#E7E4DA] text-center text-2xl font-bold text-[#141414] focus:outline-none focus:ring-2 focus:ring-[#141414]/20 disabled:opacity-50"
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
        </div>
      </div>
    </div>
  );
}
