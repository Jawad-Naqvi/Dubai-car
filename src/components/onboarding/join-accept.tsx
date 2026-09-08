"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Loader2, ArrowRight, Building2 } from "lucide-react";

/**
 * Accepts an admin-issued invitation.
 *
 * The visitor confirms their company name; the ROLE comes from the invitation
 * row on the server, so nothing sent from this form can change what kind of
 * account is created.
 */
export function JoinAccept({
  token,
  orgType,
  orgName,
  locale,
}: {
  token: string;
  orgType: string;
  orgName: string | null;
  locale: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(orgName ?? "");
  const [busy, setBusy] = useState(false);

  const isCompany = orgType === "forwarder" || orgType === "dealer";

  const accept = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/onboarding/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, orgName: name.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Welcome aboard.");
      // Partners still complete verification; admins go straight to the console.
      router.push(data.orgType === "platform" ? "/admin" : "/onboarding/verify");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not accept invitation.");
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {isCompany && (
        <label className="block">
          <span className="text-[11px] font-semibold text-[#141414]">
            Company name
          </span>
          <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#E5E5EA] px-3 focus-within:border-[#8136B2]">
            <Building2 className="h-4 w-4 text-muted flex-shrink-0" />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Registered company name"
              className="h-10 flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          <span className="mt-1 block text-[11px] text-muted">
            Use the name on your trade licence so verification is quick.
          </span>
        </label>
      )}

      <button
        type="button"
        disabled={busy || (isCompany && !name.trim())}
        onClick={accept}
        className="inline-flex items-center justify-center gap-2 h-11 w-full rounded-lg bg-[#8136B2] text-white text-xs font-semibold hover:bg-[#370B55] transition-colors disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Accept invitation
            <ArrowRight className="h-3.5 w-3.5" />
          </>
        )}
      </button>

      <p className="text-[11px] text-muted text-center leading-relaxed">
        {orgType === "forwarder"
          ? "Next you'll add your licences and the shipping lanes you serve."
          : "Next you'll complete verification."}
      </p>
      <input type="hidden" value={locale} readOnly />
    </div>
  );
}
