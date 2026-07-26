import { setRequestLocale } from "next-intl/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { Eyebrow } from "@/components/ui/eyebrow";
import { DocRequestButton } from "@/components/dashboard/doc-request-button";
import { getExportInquiriesForUser } from "@/lib/data/b2b";
import { getOrSyncUser } from "@/lib/data/users";
import { FileText, ScrollText, Stamp, Info } from "lucide-react";

export const dynamic = "force-dynamic";

const DOCS = [
  {
    key: "Vehicle Title / Ownership",
    icon: ScrollText,
    description:
      "Original ownership card / title deed from the yard, proving clear title before export.",
  },
  {
    key: "Export Certificate",
    icon: FileText,
    description:
      "UAE customs export certificate issued when the vehicle leaves the country.",
  },
  {
    key: "RTA Deregistration Letter",
    icon: Stamp,
    description:
      "RTA de-registration / cancellation letter confirming the plates were surrendered.",
  },
];

export default async function DocumentsPage({
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

  // Docs already requested via a submitted export inquiry.
  const requested = new Set(inquiries.flatMap((i) => i.docRequests));

  return (
    <>
      <DashboardHeader
        title="Document center"
        subtitle="Export paperwork for your shipments"
      />
      <main className="p-5 lg:p-8 space-y-4">
        {/* How it works */}
        <div className="rounded-2xl bg-[#F4F4F6] border border-[#E5E5EA] p-5 flex items-start gap-3">
          <Info className="h-5 w-5 text-[#8136B2] flex-shrink-0" />
          <div>
            <h2 className="text-xs font-semibold">How documents work</h2>
            <p className="mt-1 text-xs text-secondary max-w-2xl">
              DXB Motors connects you directly with the seller — we do not process
              or hold any documents ourselves. The yard provides the physical
              originals for each vehicle. Request a document below and our export
              desk will coordinate with the seller on your behalf.
            </p>
          </div>
        </div>

        {/* Doc cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {DOCS.map((doc) => {
            const isRequested = requested.has(doc.key);
            return (
              <div
                key={doc.key}
                className="rounded-2xl bg-white border border-[#E5E5EA] shadow-card p-5 flex flex-col hover:shadow-card-hover transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-[#8136B2]/10 flex items-center justify-center">
                    <doc.icon className="h-5 w-5 text-[#8136B2]" />
                  </div>
                  <Eyebrow tone="gold">EXPORT DOC</Eyebrow>
                </div>
                <h3 className="mt-4 font-semibold text-sm">{doc.key}</h3>
                <p className="mt-1 text-xs text-muted flex-1">{doc.description}</p>
                <div className="mt-4 pt-4 border-t border-[#E5E5EA] flex items-center justify-between">
                  <span className="text-[11px] text-muted">
                    Provided by the yard
                  </span>
                  <DocRequestButton docKey={doc.key} requested={isRequested} />
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
