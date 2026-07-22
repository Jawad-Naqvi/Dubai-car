"use client";

import { useRef, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { parseCsv } from "@/lib/csv";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
} from "lucide-react";

const TEMPLATE_HEADERS = [
  "make",
  "model",
  "trim",
  "year",
  "kms",
  "priceAED",
  "bodyType",
  "fuel",
  "transmission",
  "emirate",
  "vin",
  "description",
  "isExportReady",
];

const TEMPLATE_SAMPLE = [
  "Toyota,Land Cruiser,VXR,2022,45000,385000,SUV,Petrol,Automatic,Dubai,JTMHV05J004123456,Full service history · GCC spec,true",
  "Nissan,Patrol,LE,2021,60000,265000,SUV,Petrol,Automatic,Sharjah,,Single owner,false",
];

type RowResult = { row: number; ok: boolean; title?: string; error?: string };

const REQUIRED = ["make", "model", "year", "kms", "priceaed", "emirate"];

export function BulkUpload() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<RowResult[] | null>(null);

  const downloadTemplate = () => {
    const csv = [TEMPLATE_HEADERS.join(","), ...TEMPLATE_SAMPLE].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dxb-motors-inventory-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const rowError = (r: Record<string, string>): string | null => {
    for (const key of REQUIRED) {
      if (!r[key] || r[key].trim() === "") return `Missing ${key}`;
    }
    if (isNaN(Number(r.year))) return "year must be a number";
    if (isNaN(Number(r.kms))) return "kms must be a number";
    if (isNaN(Number(r.priceaed))) return "priceAED must be a number";
    return null;
  };

  const handleFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setResults(null);
    try {
      const text = await file.text();
      const parsed = parseCsv(text);
      if (parsed.length === 0) {
        toast.error("No data rows found. Use the template header row + at least one car.");
        return;
      }
      setRows(parsed);
      setFileName(file.name);
    } catch {
      toast.error("Could not read that file. Make sure it's a .csv export.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const validCount = rows.filter((r) => !rowError(r)).length;

  const importRows = async () => {
    // Only send structurally-valid rows; the server re-validates each.
    const payload = rows
      .filter((r) => !rowError(r))
      .map((r) => ({
        make: r.make,
        model: r.model,
        trim: r.trim,
        year: Number(r.year),
        kms: Number(r.kms),
        priceAED: Number(r.priceaed),
        bodyType: r.bodytype,
        fuel: r.fuel,
        transmission: r.transmission,
        emirate: r.emirate,
        vin: r.vin,
        description: r.description,
        isExportReady: r.isexportready,
      }));
    if (payload.length === 0) {
      toast.error("No valid rows to import — fix the errors highlighted below.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/listings/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResults(data.results);
      toast.success(`Imported ${data.created} of ${data.total} cars.`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Step 1 — template */}
      <div className="rounded-2xl bg-white border border-[#E5E5EA] shadow-card p-5">
        <div className="flex items-start gap-3">
          <span className="h-10 w-10 rounded-xl bg-[#F4F4F6] flex items-center justify-center flex-shrink-0">
            <FileSpreadsheet className="h-5 w-5 text-[#8136B2]" />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-[#141414]">1. Download the template</h3>
            <p className="mt-1 text-xs text-secondary">
              One row per car. Required columns: make, model, year, kms, priceAED,
              emirate. Everything else is optional.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={downloadTemplate}>
            <Download className="h-3.5 w-3.5" />
            Template
          </Button>
        </div>
      </div>

      {/* Step 2 — upload */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFile(e.dataTransfer.files);
        }}
        className="cursor-pointer rounded-2xl border border-dashed border-[#D8D4C6] bg-[#F4F4F6] hover:border-[#141414]/30 transition-colors p-8 text-center"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => handleFile(e.target.files)}
        />
        <Upload className="h-6 w-6 text-[#8136B2] mx-auto" />
        <p className="mt-3 text-xs text-secondary">
          {fileName ? (
            <span className="font-semibold text-[#141414]">{fileName}</span>
          ) : (
            <>
              Drag &amp; drop your filled CSV, or{" "}
              <span className="font-semibold text-[#141414] underline underline-offset-2">
                browse
              </span>
            </>
          )}
        </p>
      </div>

      {/* Step 3 — preview + import */}
      {rows.length > 0 && !results && (
        <div className="rounded-2xl bg-white border border-[#E5E5EA] shadow-card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-[#E5E5EA]">
            <h3 className="text-sm font-bold">
              Preview — {validCount} of {rows.length} rows ready
            </h3>
            <Button variant="gold" size="sm" onClick={importRows} disabled={busy || validCount === 0}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : `Import ${validCount} cars`}
            </Button>
          </div>
          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-xs">
              <thead className="bg-[#F4F4F6] text-[10px] uppercase tracking-widest text-muted sticky top-0">
                <tr>
                  <th className="text-start px-3 py-2 font-medium">#</th>
                  <th className="text-start px-3 py-2 font-medium">Car</th>
                  <th className="text-start px-3 py-2 font-medium">Price</th>
                  <th className="text-start px-3 py-2 font-medium">Emirate</th>
                  <th className="text-start px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const err = rowError(r);
                  return (
                    <tr key={i} className="border-t border-[#E5E5EA]">
                      <td className="px-3 py-2 text-muted">{i + 1}</td>
                      <td className="px-3 py-2 text-[#141414]">
                        {[r.year, r.make, r.model, r.trim].filter(Boolean).join(" ") || "—"}
                      </td>
                      <td className="px-3 py-2">{r.priceaed || "—"}</td>
                      <td className="px-3 py-2">{r.emirate || "—"}</td>
                      <td className="px-3 py-2">
                        {err ? (
                          <span className="inline-flex items-center gap-1 text-[#DC2626]">
                            <XCircle className="h-3 w-3" /> {err}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[#137A43]">
                            <CheckCircle2 className="h-3 w-3" /> Ready
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="rounded-2xl bg-white border border-[#E5E5EA] shadow-card overflow-hidden">
          <div className="p-4 border-b border-[#E5E5EA] flex items-center justify-between">
            <h3 className="text-sm font-bold">
              Import complete — {results.filter((r) => r.ok).length} added
            </h3>
            <Button variant="ghost" size="sm" onClick={() => { setRows([]); setResults(null); setFileName(""); }}>
              Import another batch
            </Button>
          </div>
          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-xs">
              <tbody>
                {results.map((r) => (
                  <tr key={r.row} className="border-t border-[#E5E5EA]">
                    <td className="px-3 py-2 text-muted w-10">{r.row}</td>
                    <td className="px-3 py-2">
                      {r.ok ? (
                        <span className="inline-flex items-center gap-1 text-[#137A43]">
                          <CheckCircle2 className="h-3 w-3" /> {r.title}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[#DC2626]">
                          <XCircle className="h-3 w-3" /> {r.error}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
