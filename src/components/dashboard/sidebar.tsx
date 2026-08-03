"use client";

import { Link, usePathname, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { brand } from "@/lib/brand";
import { GradientArt } from "@/components/marketing/gradient-art";
import {
  LayoutDashboard,
  Car,
  MessageSquare,
  BarChart3,
  CreditCard,
  Settings,
  Building2,
  Heart,
  Bell,
  Tag,
  Ship,
  FileText,
  Users,
  ShieldCheck,
  Flag,
  TrendingUp,
  Image as ImageIcon,
  Database,
  RefreshCw,
  Lock,
} from "lucide-react";

const dealerNav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/inventory", label: "Inventory", icon: Car },
  { href: "/dashboard/leads", label: "Leads", icon: MessageSquare },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/profile", label: "Profile", icon: Building2 },
];

// An Individual can BUY and SELL from one account, so their workspace has both
// shopping (saved, alerts, messages) and selling (my listings). "Sell your car"
// also stays as a prominent CTA at the bottom.
const buyerNav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/my-listings", label: "My listings", icon: Car },
  { href: "/dashboard/saved", label: "Saved cars", icon: Heart },
  { href: "/dashboard/alerts", label: "Alerts", icon: Bell },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
];

const b2bNav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/inquiries", label: "Export inquiries", icon: Ship },
  { href: "/dashboard/documents", label: "Documents", icon: FileText },
  { href: "/dashboard/saved", label: "Watchlist", icon: Heart },
];

const adminNav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/moderation", label: "Moderation", icon: ShieldCheck },
  { href: "/admin/reports", label: "Reported listings", icon: Flag },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/dealers", label: "Dealers", icon: Building2 },
  { href: "/admin/revenue", label: "Revenue", icon: TrendingUp },
  { href: "/admin/banners", label: "Banners", icon: ImageIcon },
  { href: "/admin/catalog", label: "Car Catalog", icon: RefreshCw },
  { href: "/admin/audit", label: "Audit log", icon: Database },
];

export function DashboardSidebar({
  role = "dealer",
}: {
  role?: "dealer" | "buyer" | "b2b" | "admin";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const items =
    role === "admin" ? adminNav : role === "buyer" ? buyerNav : role === "b2b" ? b2bNav : dealerNav;
  const isAdmin = role === "admin";

  const lockAdmin = async () => {
    await fetch("/api/admin-login", { method: "DELETE" });
    router.push("/admin-login");
    router.refresh();
  };

  return (
    <aside className="hidden lg:flex w-64 flex-col bg-[#0B0B10] min-h-screen sticky top-0 text-white">
      {/* Brand header — carries the auth-page gradient signature */}
      <div className="relative overflow-hidden border-b border-white/10">
        <GradientArt className="opacity-90" />
        <Link href="/" className="relative flex items-center gap-2.5 p-5">
          <div className="h-9 w-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center text-white font-black text-xs ring-1 ring-white/25">
            DXB
          </div>
          <span className="font-bold text-white">{brand.name}</span>
        </Link>
      </div>

      <div className="px-3 py-3">
        <div className="px-3 mb-2 text-[10px] uppercase tracking-widest text-white/40">
          {isAdmin ? "ADMIN" : role.toUpperCase()}
        </div>
        <nav className="space-y-1">
          {items.map((item) => {
            const isActive = pathname.endsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-colors",
                  isActive
                    ? "bg-white/10 text-white font-semibold ring-1 ring-white/10"
                    : "text-white/55 hover:bg-white/5 hover:text-white",
                )}
              >
                <item.icon
                  className={cn("h-4 w-4", isActive ? "text-[#8136B2]" : "")}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-white/10 space-y-2">
        {role === "buyer" && (
          <Link
            href="/dashboard/sell/new"
            className="flex items-center justify-center gap-2 h-9 rounded-xl bg-[#8136B2] text-white text-xs font-bold hover:bg-[#370B55] transition-colors"
          >
            <Tag className="h-4 w-4" />
            Sell your car
          </Link>
        )}
        {isAdmin ? (
          <button
            onClick={lockAdmin}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-xs text-white/55 hover:bg-white/5 hover:text-white"
          >
            <Lock className="h-4 w-4" />
            Lock admin
          </button>
        ) : (
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-white/55 hover:bg-white/5 hover:text-white"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        )}
      </div>
    </aside>
  );
}
