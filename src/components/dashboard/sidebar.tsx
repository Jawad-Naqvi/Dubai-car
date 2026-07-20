"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { brand } from "@/lib/brand";
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

const buyerNav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/saved", label: "Saved cars", icon: Heart },
  { href: "/dashboard/alerts", label: "Alerts", icon: Bell },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/inventory", label: "My listings", icon: Car },
  { href: "/sell", label: "Sell a car", icon: Tag },
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
  const locale = pathname.split("/")[1] || "en";

  const lockAdmin = async () => {
    await fetch("/api/admin-login", { method: "DELETE" });
    router.push(`/${locale}/admin-login`);
    router.refresh();
  };

  return (
    <aside className="hidden lg:flex w-64 flex-col bg-white border-e border-[#E7E4DA] min-h-screen sticky top-0">
      <div className="p-5 border-b border-[#E7E4DA]">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-[#141414] flex items-center justify-center text-white font-black text-xs">
            DXB
          </div>
          <span className="font-bold">{brand.name}</span>
        </Link>
      </div>

      <div className="px-3 py-2.5">
        <div className="px-3 mb-2 text-[10px] uppercase tracking-widest text-muted">
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
                    ? "bg-[#F0941F]/10 text-[#C97612] font-semibold"
                    : "text-secondary hover:bg-[#F3F1E9] hover:text-[#141414]",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-[#E7E4DA]">
        {isAdmin ? (
          <button
            onClick={lockAdmin}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-xs text-secondary hover:bg-[#F3F1E9] hover:text-[#141414]"
          >
            <Lock className="h-4 w-4" />
            Lock admin
          </button>
        ) : (
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-secondary hover:bg-[#F3F1E9] hover:text-[#141414]"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        )}
      </div>
    </aside>
  );
}
