import { DashboardHeader } from "@/components/dashboard/header";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getOrSyncUser, getCurrentRole } from "@/lib/data/users";
import Link from "next/link";
import { User, Globe, Bell, ShieldCheck } from "lucide-react";

export default async function SettingsPage() {
  const [user, role] = await Promise.all([
    getOrSyncUser().catch(() => null),
    getCurrentRole().catch(() => "buyer" as const),
  ]);

  return (
    <>
      <DashboardHeader title="Settings" subtitle="Account & preferences" />
      <main className="p-5 space-y-4 max-w-3xl">
        {/* Account */}
        <div className="rounded bg-[#161616] border border-white/8 p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-4 w-4 text-[#F0CE5C]" />
            <Eyebrow tone="gold">ACCOUNT</Eyebrow>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted mb-1">Name</div>
              <div className="text-white">{user?.name ?? "—"}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted mb-1">Email</div>
              <div className="text-white">{user?.email ?? "Not signed in"}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted mb-1">Role</div>
              <Badge tone="new">{role.toUpperCase()}</Badge>
            </div>
          </div>
          <p className="mt-4 text-[11px] text-muted">
            Manage your password and security from the account menu (avatar, top-right).
          </p>
        </div>

        {/* Preferences */}
        <div className="rounded bg-[#161616] border border-white/8 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-4 w-4 text-[#F0CE5C]" />
            <Eyebrow tone="gold">PREFERENCES</Eyebrow>
          </div>
          <div className="space-y-3 text-sm">
            <label className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-secondary">
                <Bell className="h-3.5 w-3.5" /> Email me new leads
              </span>
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-[#D4AF37]" />
            </label>
            <label className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-secondary">
                <Bell className="h-3.5 w-3.5" /> WhatsApp lead alerts
              </span>
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-[#D4AF37]" />
            </label>
          </div>
        </div>

        {/* Plan shortcut */}
        <div className="rounded bg-[#161616] border border-white/8 p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#F0CE5C]" />
            <span className="text-sm">Subscription & billing</span>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/billing">Manage</Link>
          </Button>
        </div>
      </main>
    </>
  );
}
