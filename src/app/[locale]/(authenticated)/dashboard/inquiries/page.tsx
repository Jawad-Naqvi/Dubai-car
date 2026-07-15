import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { getExportInquiriesForUser } from "@/lib/data/b2b";
import { getOrSyncUser } from "@/lib/data/users";
import { Ship, MapPin, Package, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const STATUS_CHIP: Record<string, string> = {
  new: "bg-[#1B4FA0]/10 text-[#1B4FA0]",
  quoted: "bg-[#F0941F]/10 text-[#C97612]",
  closed: "bg-[#F3F1E9] text-secondary",
};

export default async function InquiriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getOrSyncUser().catch(() => null);
  const inquiries = user
    ? await getExportInquiriesForUser(user.id).catch(() => [])
    : [];

  return (
    <>
      <DashboardHeader
        title="Export inquiries"
        subtitle={`${inquiries.length} ${inquiries.length === 1 ? "inquiry" : "inquiries"}`}
      />
      <main className="p-5 lg:p-8">
        {inquiries.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-24 rounded-3xl bg-white border border-[#E7E4DA] shadow-card">
            <Ship className="h-8 w-8 text-muted mb-3" />
            <h3 className="text-sm font-semibold">No export inquiries yet</h3>
            <p className="mt-1 text-xs text-muted max-w-xs">
              Build a shipment on the export desk and we&apos;ll match you with
              export-ready cars and yards.
            </p>
            <Button asChild variant="gold" size="md" className="mt-5">
              <Link href="/export">
                <Ship className="h-4 w-4" />
                Start an inquiry
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {inquiries.map((i) => (
              <div
                key={i.id}
                className="rounded-2xl bg-white border border-[#E7E4DA] shadow-card p-5 hover:shadow-card-hover transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="h-4 w-4 text-[#F0941F] flex-shrink-0" />
                    <h3 className="font-semibold text-sm truncate">
                      {i.destinationCountry}
                    </h3>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold flex-shrink-0 ${
                      STATUS_CHIP[i.status] ?? "bg-[#F3F1E9] text-secondary"
                    }`}
                  >
                    {i.status}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-secondary">
                  <span className="flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-muted" />
                    {i.vehicleCount} {i.vehicleCount === 1 ? "vehicle" : "vehicles"}
                  </span>
                  {i.shippingPreference && (
                    <span className="flex items-center gap-1.5">
                      <Ship className="h-3.5 w-3.5 text-muted" />
                      {i.shippingPreference}
                    </span>
                  )}
                  <span className="text-muted">{timeAgo(i.createdAt)}</span>
                </div>

                {i.docRequests.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted mb-2">
                      <FileText className="h-3.5 w-3.5" />
                      Documents requested
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {i.docRequests.map((d) => (
                        <span
                          key={d}
                          className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-[#F3F1E9] text-secondary"
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {i.notes && (
                  <p className="mt-4 text-xs text-secondary border-t border-[#E7E4DA] pt-3">
                    {i.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
