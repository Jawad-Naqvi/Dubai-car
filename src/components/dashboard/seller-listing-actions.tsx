"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/routing";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatAED } from "@/lib/utils";
import { Loader2, Pencil, Tag } from "lucide-react";

/**
 * Owner controls for a private seller's own listing card: a quick "Edit price"
 * dialog (PATCH /price — records history + a price-drop badge) and a link to the
 * full edit form. Kept as a small client island so the surrounding My-listings
 * view stays a server component.
 */
export function SellerListingActions({
  listingId,
  price,
}: {
  listingId: string;
  price: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(String(price));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const next = Number(value);
    if (!Number.isFinite(next) || next < 1000) {
      toast.error("Enter a valid price (at least AED 1,000).");
      return;
    }
    if (next === price) {
      setOpen(false);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/listings/${listingId}/price`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not update price.");
      toast.success(
        next < price
          ? `Price dropped to ${formatAED(next)} — buyers will see a price-drop badge.`
          : `Price updated to ${formatAED(next)}.`,
      );
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update price.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
          <Tag className="h-3.5 w-3.5" />
          Edit price
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href={`/dashboard/my-listings/${listingId}/edit`}>
            <Pencil className="h-3.5 w-3.5" />
            Edit details
          </Link>
        </Button>
      </div>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Update asking price"
        description="Lowering the price shows buyers a 'price drop' badge and records it in this car's price history."
      >
        <label className="text-[11px] uppercase tracking-wider text-muted mb-1.5 block">
          Asking price (AED)
        </label>
        <input
          type="number"
          autoFocus
          className="w-full h-10 rounded-xl bg-white border border-[#E5E5EA] px-3 text-sm text-[#141414] focus:outline-none focus:border-[#141414]/40 focus:ring-2 focus:ring-[#141414]/10"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          min={1000}
        />
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="ghost" size="md" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="gold" size="md" onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save price
          </Button>
        </div>
      </Modal>
    </>
  );
}
