"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import type { InvoiceView } from "@/lib/data/payments";

function csvEscape(value: string | number) {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Client-side CSV export of the billing history table. */
export function InvoicesExport({ invoices }: { invoices: InvoiceView[] }) {
  const exportCsv = () => {
    if (invoices.length === 0) {
      toast.info("No invoices to export yet");
      return;
    }
    const header = ["Invoice", "Description", "Type", "Date", "Amount (AED)", "Status"];
    const rows = invoices.map((inv) => [
      inv.id,
      inv.description,
      inv.type,
      inv.createdAt,
      inv.amountAED,
      inv.status,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dxb-motors-invoices-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${invoices.length} invoice${invoices.length === 1 ? "" : "s"}`);
  };

  return (
    <Button variant="ghost" size="sm" onClick={exportCsv}>
      <Download className="h-4 w-4" /> Export CSV
    </Button>
  );
}
