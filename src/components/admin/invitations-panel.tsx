"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Copy,
  Check,
  Link2,
  ShieldAlert,
  XCircle,
} from "lucide-react";

/**
 * Where admins mint onboarding links.
 *
 * The token is shown exactly once, at creation. Only its SHA-256 is stored, so
 * a database dump can't be replayed into an account — and neither can we
 * recover a link someone lost, which is the correct trade.
 */

interface InviteRow {
  id: string;
  email: string | null;
  orgType: string;
  orgName: string | null;
  grantsAdmin: boolean;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export function InvitationsPanel({
  invitations,
  origin,
  locale,
}: {
  invitations: InviteRow[];
  origin: string;
  locale: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [orgType, setOrgType] = useState("forwarder");
  const [email, setEmail] = useState("");
  const [orgName, setOrgName] = useState("");
  const [busy, setBusy] = useState(false);
  const [freshLink, setFreshLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const create = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgType,
          email: email.trim() || undefined,
          orgName: orgName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFreshLink(`${origin}/${locale}${data.joinPath}`);
      setEmail("");
      setOrgName("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create invite.");
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/invitations?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Invitation revoked.");
      router.refresh();
    } catch {
      toast.error("Could not revoke.");
    }
  };

  const copy = async () => {
    if (!freshLink) return;
    try {
      await navigator.clipboard.writeText(freshLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy — select the link and copy it manually.");
    }
  };

  return (
    <div className="rounded-xl border border-[#E5E5EA] bg-white overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[#E5E5EA] px-4 py-3">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-[#8136B2]" />
          <div>
            <h3 className="text-xs font-bold text-[#141414]">
              Onboarding links
            </h3>
            <p className="text-[11px] text-muted">
              How freight partners and admins get accounts.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            setFreshLink(null);
          }}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#8136B2] text-white text-[11px] font-semibold hover:bg-[#370B55] transition-colors flex-shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          New link
        </button>
      </div>

      {open && (
        <div className="border-b border-[#E5E5EA] bg-[#F4F4F6] p-4 space-y-3">
          {freshLink ? (
            <div className="rounded-lg border border-[#137A43]/30 bg-[#137A43]/5 p-3">
              <p className="text-[11px] font-semibold text-[#137A43]">
                Link created — copy it now
              </p>
              <p className="mt-0.5 text-[10px] text-secondary">
                This is the only time it will be shown. Send it to the partner
                directly.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 min-w-0 truncate rounded bg-white px-2 py-1.5 text-[10px] text-[#141414] border border-[#E5E5EA]">
                  {freshLink}
                </code>
                <button
                  type="button"
                  onClick={copy}
                  className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-[#141414] text-white text-[10px] font-semibold flex-shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" /> Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="block">
                  <span className="text-[11px] font-semibold text-[#141414]">
                    Type
                  </span>
                  <select
                    value={orgType}
                    onChange={(e) => setOrgType(e.target.value)}
                    className="mt-1 w-full h-9 rounded-lg border border-[#E5E5EA] bg-white px-2 text-xs outline-none focus:border-[#8136B2]"
                  >
                    <option value="forwarder">Freight partner</option>
                    <option value="dealer">Dealer</option>
                    <option value="platform">Platform admin</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold text-[#141414]">
                    Company{" "}
                    <span className="font-normal text-muted">(optional)</span>
                  </span>
                  <input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Company name"
                    className="mt-1 w-full h-9 rounded-lg border border-[#E5E5EA] bg-white px-2 text-xs outline-none focus:border-[#8136B2]"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold text-[#141414]">
                    Lock to email{" "}
                    <span className="font-normal text-muted">(optional)</span>
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="partner@company.com"
                    className="mt-1 w-full h-9 rounded-lg border border-[#E5E5EA] bg-white px-2 text-xs outline-none focus:border-[#8136B2]"
                  />
                </label>
              </div>

              {orgType === "platform" && (
                <div className="flex items-start gap-2 rounded-lg border border-[#DC2626]/25 bg-[#DC2626]/5 p-2.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-[#DC2626] flex-shrink-0 mt-px" />
                  <p className="text-[10px] text-[#DC2626] leading-relaxed">
                    This grants full admin access on acceptance. Lock it to an
                    email address you trust.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={create}
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 h-9 w-full sm:w-auto sm:px-6 rounded-lg bg-[#141414] text-white text-xs font-semibold hover:bg-[#2E2C28] transition-colors disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Create link"
                )}
              </button>
            </>
          )}
        </div>
      )}

      {invitations.length === 0 ? (
        <p className="px-4 py-6 text-center text-[11px] text-muted">
          No invitations issued yet.
        </p>
      ) : (
        <ul className="divide-y divide-[#E5E5EA] max-h-80 overflow-y-auto">
          {invitations.map((inv) => {
            const expired = new Date(inv.expiresAt).getTime() < Date.now();
            const state = inv.revokedAt
              ? "Revoked"
              : inv.acceptedAt
                ? "Accepted"
                : expired
                  ? "Expired"
                  : "Pending";
            const tone =
              state === "Accepted"
                ? "bg-[#137A43]/12 text-[#137A43]"
                : state === "Pending"
                  ? "bg-[#1B4FA0]/10 text-[#1B4FA0]"
                  : "bg-[#F4F4F6] text-[#63666A]";

            return (
              <li
                key={inv.id}
                className="flex items-center justify-between gap-3 px-4 py-2.5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-semibold text-[#141414] truncate">
                      {inv.orgName || inv.email || "Unnamed"}
                    </span>
                    {inv.grantsAdmin && (
                      <span className="rounded-full bg-[#DC2626]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#DC2626]">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted">
                    {inv.orgType} · expires{" "}
                    {new Date(inv.expiresAt).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tone}`}
                  >
                    {state}
                  </span>
                  {state === "Pending" && (
                    <button
                      type="button"
                      onClick={() => revoke(inv.id)}
                      aria-label="Revoke invitation"
                      className="h-6 w-6 grid place-items-center rounded-full text-muted hover:bg-[#F4F4F6] hover:text-[#DC2626]"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
