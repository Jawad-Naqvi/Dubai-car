import { DashboardHeader } from "@/components/dashboard/header";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getOrSyncUser, getCurrentRole } from "@/lib/data/users";
import { NotificationPrefs } from "@/components/dashboard/notification-prefs";
import { Link } from "@/i18n/routing";
import { User, Globe, ShieldCheck } from "lucide-react";

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
        <div className="rounded-2xl bg-white border border-[#E7E4DA] shadow-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-4 w-4 text-[#F0941F]" />
            <Eyebrow tone="gold">ACCOUNT</Eyebrow>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted mb-1">Name</div>
              <div className="text-[#141414]">{user?.name ?? "—"}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted mb-1">Email</div>
              <div className="text-[#141414]">{user?.email ?? "Not signed in"}</div>
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
        <div className="rounded-2xl bg-white border border-[#E7E4DA] shadow-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-4 w-4 text-[#F0941F]" />
            <Eyebrow tone="gold">PREFERENCES</Eyebrow>
          </div>
          <NotificationPrefs />
        </div>

        {/* Plan shortcut */}
        <div className="rounded-2xl bg-white border border-[#E7E4DA] shadow-card p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#F0941F]" />
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
