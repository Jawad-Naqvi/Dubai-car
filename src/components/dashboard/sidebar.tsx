"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Ship,
  FileText,
  Users,
  ShieldCheck,
  TrendingUp,
  Image as ImageIcon,
  Database,
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
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/dealers", label: "Dealers", icon: Building2 },
  { href: "/admin/revenue", label: "Revenue", icon: TrendingUp },
  { href: "/admin/banners", label: "Banners", icon: ImageIcon },
  { href: "/admin/audit", label: "Audit log", icon: Database },
];

export function DashboardSidebar({
  role = "dealer",
}: {
  role?: "dealer" | "buyer" | "b2b" | "admin";
}) {
  const pathname = usePathname();
  const items =
    role === "admin" ? adminNav : role === "buyer" ? buyerNav : role === "b2b" ? b2bNav : dealerNav;
  const isAdmin = role === "admin";

  return (
    <aside className="hidden lg:flex w-64 flex-col bg-[#121212] border-e border-white/5 min-h-screen sticky top-0">
      <div className="p-5 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-sm bg-gradient-to-br from-[#F0CE5C] via-[#D4AF37] to-[#8C7220] flex items-center justify-center text-[#1A1208] font-black text-xs">
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
                  "flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs transition-colors",
                  isActive
                    ? "bg-[#D4AF37]/15 text-[#F0CE5C] ring-1 ring-[#D4AF37]/30"
                    : "text-secondary hover:bg-white/5 hover:text-white",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-white/5">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-sm text-xs text-secondary hover:bg-white/5"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
