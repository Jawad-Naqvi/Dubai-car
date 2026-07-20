import { setRequestLocale } from "next-intl/server";
import { getCatalogMakes, getCatalogModels } from "@/lib/data/catalog";
import { recentSyncRuns } from "@/lib/catalog/sync";
import { isDbEnabled } from "@/lib/db/enabled";
import { CatalogSyncButton } from "@/components/admin/catalog-sync";
import { Database, Globe, ImageIcon, RefreshCw } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminCatalogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [makes, models, runs] = await Promise.all([
    getCatalogMakes(),
    getCatalogModels({ limit: 1000 }),
    recentSyncRuns(8),
  ]);
  const withImages = models.filter((m) => !m.imageUrl.startsWith("data:")).length;
  const dbOn = isDbEnabled();

  return (
    <div className="p-5 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight">Vehicle Catalog</h1>
          <p className="mt-1 text-xs text-secondary max-w-lg">
            Auto-synced from NHTSA vPIC (models), Wikimedia/IMAGIN (imagery), and
            API-Ninjas/CarAPI (specs). A daily cron keeps it current — new models
            appear the day manufacturers register them.
          </p>
        </div>
        <CatalogSyncButton />
      </div>

      {!dbOn && (
        <div className="mt-4 rounded-xl bg-[#FBEAD3] border border-[#F0941F]/30 px-4 py-3 text-xs text-[#8A5A12]">
          Demo mode: serving the bundled catalog snapshot (generated from the same live
          APIs). Configure DATABASE_URL to enable persistent syncs and the daily cron.
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Globe, label: "Makes", value: makes.length },
          { icon: Database, label: "Models", value: models.length },
          { icon: ImageIcon, label: "With imagery", value: withImages },
          { icon: RefreshCw, label: "Sync runs", value: runs.length },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-2xl bg-white shadow-card p-4">
            <Icon className="h-4 w-4 text-[#F0941F] mb-2" />
            <div className="text-2xl font-bold text-[#141414]">{value}</div>
            <div className="mt-0.5 text-[10px] text-secondary uppercase tracking-wider">{label}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl bg-white shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E7E4DA] text-sm font-semibold">
          Recent sync runs
        </div>
        {runs.length === 0 ? (
          <div className="px-5 py-8 text-xs text-secondary">
            No sync runs recorded yet{dbOn ? " — trigger one above." : " (requires database)."}
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-muted border-b border-[#E7E4DA]">
                <th className="px-5 py-2.5 font-medium">Started</th>
                <th className="px-5 py-2.5 font-medium">Trigger</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
                <th className="px-5 py-2.5 font-medium">New models</th>
                <th className="px-5 py-2.5 font-medium">Images</th>
                <th className="px-5 py-2.5 font-medium">Specs</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => {
                const s = (r.stats ?? {}) as Record<string, number>;
                return (
                  <tr key={r.id} className="border-b border-[#E7E4DA] last:border-0">
                    <td className="px-5 py-2.5">{r.startedAt.toLocaleString()}</td>
                    <td className="px-5 py-2.5 capitalize">{r.trigger}</td>
                    <td className="px-5 py-2.5">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          r.status === "success"
                            ? "bg-[#1A7A4A]/10 text-[#1A7A4A]"
                            : r.status === "running"
                              ? "bg-[#F0941F]/10 text-[#C97612]"
                              : "bg-[#DC2626]/10 text-[#DC2626]"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-2.5">{s.modelsCreated ?? "—"}</td>
                    <td className="px-5 py-2.5">{s.imagesResolved ?? "—"}</td>
                    <td className="px-5 py-2.5">{s.specsResolved ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-8">
        <div className="text-sm font-semibold mb-3">Coverage by make</div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {makes.map((m) => (
            <div key={m.slug} className="rounded-xl bg-white shadow-card px-3.5 py-2.5 flex items-center justify-between">
              <span className="text-xs font-medium truncate">{m.name}</span>
              <span className="text-[10px] text-secondary font-semibold">{m.modelCount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
