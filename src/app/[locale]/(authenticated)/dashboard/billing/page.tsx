import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eyebrow } from "@/components/ui/eyebrow";
import { PlanManager } from "@/components/dashboard/plan-manager";
import { formatAED } from "@/lib/utils";
import { getDealerContext } from "@/lib/data/dashboard";
import { getInvoices } from "@/lib/data/payments";
import { CreditCard, Download, Receipt } from "lucide-react";

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
          <div className="rounded bg-[#161616] border border-white/8 p-7">
            <Eyebrow tone="emerald">PAYMENT METHOD</Eyebrow>
            <div className="mt-4 flex items-center gap-4">
              <div className="h-12 w-16 rounded-sm bg-gradient-to-br from-[#1A1A1A] to-[#D4AF37] flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-semibold">Visa · ••• 4242</div>
                <div className="text-xs text-muted">Expires 09/27</div>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="mt-5 w-full">
              Change payment method
            </Button>
          </div>
        </div>

        {/* Invoices */}
        <div className="rounded bg-[#161616] border border-white/8 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <div>
              <Eyebrow tone="gold">INVOICES</Eyebrow>
              <h2 className="mt-2 text-xs font-semibold">Billing history</h2>
            </div>
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
          {invoices.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted">No invoices yet.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-[#121212] text-[10px] uppercase tracking-widest text-muted">
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
                  <tr key={inv.id} className="border-t border-white/5 hover:bg-white/[0.02]">
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
          )}
        </div>
      </main>
    </>
  );
}
