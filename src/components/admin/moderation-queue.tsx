"use client";

import { useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatAED } from "@/lib/utils";
import type { ModerationItem } from "@/lib/data/admin";
import { CheckCircle2, XCircle, Eye, Inbox } from "lucide-react";

export function ModerationQueue({ items }: { items: ModerationItem[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [resolved, setResolved] = useState<Record<string, "approve" | "reject">>({});

  const moderate = async (id: string, action: "approve" | "reject") => {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error();
      setResolved((r) => ({ ...r, [id]: action }));
      toast.success(action === "approve" ? "Listing approved & live" : "Listing rejected");
      router.refresh();
    } catch {
      toast.error("Action failed");
    } finally {
      setBusy(null);
    }
  };

  const pending = items.filter((i) => !resolved[i.id]);

  if (pending.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-24 rounded-2xl bg-white shadow-card border border-[#E5E5EA]">
        <Inbox className="h-8 w-8 text-muted mb-3" />
        <h3 className="text-sm font-semibold text-[#141414]">Queue is clear</h3>
        <p className="mt-1 text-xs text-muted">No listings awaiting review.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {pending.map((l) => (
        <div
          key={l.id}
          className={`rounded-2xl bg-white shadow-card border border-[#E5E5EA] overflow-hidden hover:shadow-card-hover transition-shadow ${
            busy === l.id ? "opacity-50" : ""
          }`}
        >
          <div className="grid grid-cols-[160px_1fr]">
            <div className="bg-[#F4F4F6]">
              <div className="relative aspect-square">
                <Image src={l.imageUrl} alt="" fill sizes="160px" className="object-cover" />
                {l.images.length > 1 && (
                  <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                    {l.images.length} photos
                  </span>
                )}
              </div>
              {l.images.length > 1 && (
                <div className="flex gap-1 overflow-x-auto p-1">
                  {l.images.slice(0, 6).map((src, i) => (
                    <div
                      key={i}
                      className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded bg-[#E5E5EA]"
                    >
                      <Image src={src} alt="" fill sizes="36px" className="object-cover" />
                    </div>
                  ))}
                  {l.images.length > 6 && (
                    <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded bg-[#E5E5EA] text-[9px] font-semibold text-secondary">
                      +{l.images.length - 6}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-xs truncate text-[#141414]">{l.title}</h3>
                  <div className="text-xs text-muted">
                    DXB-{l.id} · {l.dealerName}
                  </div>
                </div>
                <Badge tone="reserved">PENDING</Badge>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                <div>
                  <span className="text-muted">Price · </span>
                  <span className="font-semibold">{formatAED(l.priceAED)}</span>
                </div>
                <div>
                  <span className="text-muted">Spec · </span>
                  <span>{l.regionalSpec}</span>
                </div>
                <div>
                  <span className="text-muted">KMs · </span>
                  <span>{l.kms.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted">Emirate · </span>
                  <span>{l.emirate}</span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="emerald"
                  size="sm"
                  onClick={() => moderate(l.id, "approve")}
                  disabled={busy !== null}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Approve
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => moderate(l.id, "reject")}
                  disabled={busy !== null}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/listings/${l.id}/${l.slug}`} target="_blank">
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
