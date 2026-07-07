"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RadialGlow } from "@/components/marketing/radial-glow";
import { Loader2, CheckCircle2 } from "lucide-react";

const inputCls =
  "h-11 w-full rounded-sm bg-white border border-[#E5E5E5] text-[#1A1A1A] placeholder:text-muted px-3 text-sm focus:outline-none focus:border-[#C8A93E]";

export function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "I'm a yard / dealer",
    message: "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || (!form.email && !form.phone)) {
      toast.error("Please add your name and an email or phone.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "inquiry",
          buyerName: `${form.firstName} ${form.lastName}`.trim(),
          buyerEmail: form.email,
          buyerPhone: form.phone,
          message: `[${form.role}] ${form.message}`,
        }),
      });
      if (!res.ok) throw new Error();
      setDone(true);
      toast.success("Message sent — we'll reply within one business day.");
    } catch {
      toast.error("Could not send. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl bg-white border border-[#E5E5E5] shadow-card p-5 lg:p-6 grain relative overflow-hidden">
      <RadialGlow color="gold" size="md" className="-top-20 -right-20 opacity-30" />
      <div className="relative">
        <h2 className="text-2xl font-bold">Send us a message</h2>

        {done ? (
          <div className="mt-8 flex flex-col items-center text-center py-8">
            <CheckCircle2 className="h-10 w-10 text-[#C8A93E]" />
            <h3 className="mt-3 text-sm font-semibold">Thanks — message received</h3>
            <p className="mt-1 text-xs text-muted max-w-xs">
              Our team will get back to you within one business day.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="First name"
                value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                className={inputCls}
              />
              <input
                placeholder="Last name"
                value={form.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                className={inputCls}
              />
            </div>
            <input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className={inputCls}
            />
            <input
              placeholder="Phone"
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className={inputCls}
            />
            <select
              value={form.role}
              onChange={(e) => set("role", e.target.value)}
              className={inputCls}
            >
              <option>I&apos;m a yard / dealer</option>
              <option>I&apos;m a private seller</option>
              <option>I&apos;m a local buyer</option>
              <option>I&apos;m a B2B importer</option>
            </select>
            <textarea
              placeholder="Tell us how we can help…"
              rows={5}
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
              className="w-full rounded-sm bg-white border border-[#E5E5E5] text-[#1A1A1A] placeholder:text-muted px-3 py-2 text-sm focus:outline-none focus:border-[#C8A93E]"
            />
            <Button
              type="submit"
              variant="gold"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Send message
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
