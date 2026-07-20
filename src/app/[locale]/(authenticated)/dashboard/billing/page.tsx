import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eyebrow } from "@/components/ui/eyebrow";
import { PlanManager } from "@/components/dashboard/plan-manager";
import { InvoicesExport } from "@/components/dashboard/invoices-export";
import { formatAED } from "@/lib/utils";
import { brand } from "@/lib/brand";
import { getDealerContext } from "@/lib/data/dashboard";
import { getInvoices } from "@/lib/data/payments";
import { CreditCard, Receipt } from "lucide-react";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-AE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function BillingPage() {
  const [ctx, invoices] = await Promise.all([getDealerContext(), getInvoices()]);

  return (
    <>
      <DashboardHeader title="Billing" subtitle="Plan, payment method, invoices" />

      <main className="p-5 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <PlanManager
            currentTier={ctx.tier}
            listingsUsed={ctx.listingsUsed}
            listingQuota={ctx.listingQuota}
          />

          {/* Payment method */}
          <div className="rounded-2xl bg-white border border-[#E7E4DA] shadow-card p-5">
            <Eyebrow tone="emerald">PAYMENT METHOD</Eyebrow>
            <div className="mt-4 flex items-center gap-4">
              <div className="h-12 w-16 rounded-lg bg-[#141414] flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-semibold">Visa · ••• 4242</div>
                <div className="text-xs text-muted">Expires 09/27</div>
              </div>
            </div>
            <Button asChild variant="ghost" size="sm" className="mt-5 w-full">
              <a
                href={`mailto:${brand.supportEmail}?subject=${encodeURIComponent("Change payment method")}`}
              >
                Change payment method
              </a>
            </Button>
          </div>
        </div>

        {/* Invoices */}
        <div className="rounded-2xl bg-white border border-[#E7E4DA] shadow-card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-[#E7E4DA]">
            <div>
              <Eyebrow tone="gold">INVOICES</Eyebrow>
              <h2 className="mt-2 text-xs font-semibold">Billing history</h2>
            </div>
            <InvoicesExport invoices={invoices} />
          </div>
          {invoices.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted">No invoices yet.</div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F3F1E9] text-[10px] uppercase tracking-widest text-muted">
                <tr>
                  <th className="text-start p-4 font-medium">Invoice</th>
                  <th className="text-start p-4 font-medium">Description</th>
                  <th className="text-start p-4 font-medium">Date</th>
                  <th className="text-start p-4 font-medium">Amount</th>
                  <th className="text-start p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-t border-[#E7E4DA] hover:bg-[#F1EFE9]">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-muted" />
                        <span className="text-xs font-mono">{inv.id}</span>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-secondary capitalize">{inv.description}</td>
                    <td className="p-4 text-xs text-secondary">{fmtDate(inv.createdAt)}</td>
                    <td className="p-4 font-semibold">{formatAED(inv.amountAED)}</td>
                    <td className="p-4">
                      <Badge tone="verified">{inv.status.toUpperCase()}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
