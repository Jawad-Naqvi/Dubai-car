"use client";

import { useState, useEffect } from "react";
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
  Menu,
  X,
  Layers,
  Package,
} from "lucide-react";

/**
 * Navigation is grouped by what the user is trying to DO, not by which system
 * module the feature lives in. Both journeys share the same vocabulary:
 * Marketplace (supply + demand coming in) → Sales (money moving) →
 * Communication → Business.
 */
interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}
interface NavGroup {
  heading?: string;
  items: NavItem[];
}

const dealerNav: NavGroup[] = [
  { items: [{ href: "/dashboard", label: "Overview", icon: LayoutDashboard }] },
  {
    heading: "Marketplace",
    items: [
      { href: "/dashboard/inventory", label: "Inventory", icon: Car },
      { href: "/dashboard/leads", label: "Enquiries", icon: MessageSquare },
      { href: "/dashboard/quotes", label: "Quote requests", icon: Layers },
    ],
  },
  {
    heading: "Sales",
    items: [
      { href: "/dashboard/orders", label: "Orders", icon: Package },
      { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    heading: "Communication",
    items: [
      { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
    ],
  },
  {
    heading: "Business",
    items: [
      { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
      { href: "/dashboard/profile", label: "Dealership profile", icon: Building2 },
    ],
  },
];

// An Individual can BUY and SELL from one account, so their workspace has both
// shopping (saved, alerts, messages) and selling (my listings). "Sell your car"
// also stays as a prominent CTA at the bottom. Quote requests only matter to
// buyers purchasing in volume, so they sit under Buying, not in their own silo.
const buyerNav: NavGroup[] = [
  { items: [{ href: "/dashboard", label: "Overview", icon: LayoutDashboard }] },
  {
    heading: "Buying",
    items: [
      { href: "/dashboard/orders", label: "My orders", icon: Package },
      { href: "/dashboard/quotes", label: "Quote requests", icon: Layers },
      { href: "/dashboard/saved", label: "Saved cars", icon: Heart },
      { href: "/dashboard/alerts", label: "Alerts", icon: Bell },
    ],
  },
  {
    heading: "Selling",
    items: [
      { href: "/dashboard/my-listings", label: "My listings", icon: Car },
      // Individuals sell too — they get performance on their own cars.
      { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    heading: "Shipping",
    items: [
      { href: "/dashboard/shipping", label: "Get quotes", icon: Ship },
      { href: "/dashboard/shipments", label: "Track shipments", icon: Package },
    ],
  },
  {
    heading: "Communication",
    items: [
      { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
    ],
  },
];

/** Freight partners get their own workspace — bids, lanes and live shipments. */
const forwarderNav: NavGroup[] = [
  { items: [{ href: "/dashboard/freight", label: "Requests", icon: Package }] },
  {
    heading: "Operations",
    items: [
      { href: "/dashboard/shipments", label: "Shipments", icon: Ship },
      { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
    ],
  },
  {
    heading: "Company",
    items: [{ href: "/dashboard/settings", label: "Settings", icon: Settings }],
  },
];

// Importers are bulk buyers first — quotes and orders lead, export paperwork
// is a service on top rather than the whole product.
const b2bNav: NavGroup[] = [
  { items: [{ href: "/dashboard", label: "Overview", icon: LayoutDashboard }] },
  {
    heading: "Buying",
    items: [
      { href: "/dashboard/quotes", label: "Quote requests", icon: Layers },
      { href: "/dashboard/orders", label: "My orders", icon: Package },
      { href: "/dashboard/saved", label: "Watchlist", icon: Heart },
    ],
  },
  {
    heading: "Export",
    items: [
      { href: "/dashboard/inquiries", label: "Shipments", icon: Ship },
      { href: "/dashboard/documents", label: "Documents", icon: FileText },
    ],
  },
  {
    heading: "Communication",
    items: [
      { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
    ],
  },
];

const adminNav: NavGroup[] = [
  { items: [{ href: "/admin", label: "Overview", icon: LayoutDashboard }] },
  {
    heading: "Marketplace",
    items: [
      { href: "/admin/moderation", label: "Moderation", icon: ShieldCheck },
      { href: "/admin/reports", label: "Reported listings", icon: Flag },
      { href: "/admin/catalog", label: "Car catalog", icon: RefreshCw },
    ],
  },
  {
    heading: "People",
    items: [
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/dealers", label: "Dealers", icon: Building2 },
      { href: "/admin/partners", label: "Partner network", icon: Ship },
    ],
  },
  {
    heading: "Business",
    items: [
      { href: "/admin/revenue", label: "Revenue", icon: TrendingUp },
      { href: "/admin/banners", label: "Banners", icon: ImageIcon },
      { href: "/admin/audit", label: "Audit log", icon: Database },
    ],
  },
];

/** Plain-language workspace label — buyers never see "B2B" or "B2C". */
const ROLE_LABEL: Record<
  "dealer" | "buyer" | "b2b" | "admin" | "forwarder",
  string
> = {
  dealer: "DEALER",
  buyer: "MY ACCOUNT",
  b2b: "BUSINESS BUYER",
  admin: "ADMIN",
  forwarder: "FREIGHT PARTNER",
};

export function DashboardSidebar({
  role = "dealer",
}: {
  role?: "dealer" | "buyer" | "b2b" | "admin" | "forwarder";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const groups =
    role === "admin"
      ? adminNav
      : role === "forwarder"
        ? forwarderNav
        : role === "buyer"
          ? buyerNav
          : role === "b2b"
            ? b2bNav
            : dealerNav;
  const isAdmin = role === "admin";

  // Admin is a role on the normal session now, not a separate PIN login, so
  // leaving the admin area is just navigating away — there is no second
  // credential to discard.
  const lockAdmin = () => {
    router.push("/dashboard");
    router.refresh();
  };

  // While the mobile drawer is open: lock body scroll and close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Shared inner content — used by both the desktop rail and the mobile drawer.
  // `onNavigate` closes the drawer after a tap on mobile (no-op on desktop).
  const panel = (onNavigate: () => void) => (
    <>
      {/* Brand header — carries the auth-page gradient signature */}
      <div className="relative overflow-hidden border-b border-white/10">
        <GradientArt className="opacity-90" />
        <Link
          href="/"
          onClick={onNavigate}
          className="relative flex items-center gap-2.5 p-5"
        >
          <div className="h-9 w-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center text-white font-black text-xs ring-1 ring-white/25">
            DXB
          </div>
          <span className="font-bold text-white">{brand.name}</span>
        </Link>
      </div>

      <div className="px-3 py-3">
        <div className="px-3 mb-2 text-[10px] uppercase tracking-widest text-white/40">
          {isAdmin ? "ADMIN" : ROLE_LABEL[role]}
        </div>
        <nav className="space-y-4">
          {groups.map((group, gi) => (
            <div key={group.heading ?? `group-${gi}`} className="space-y-1">
              {group.heading && (
                <div className="px-3 pt-1 pb-1 text-[9px] uppercase tracking-widest text-white/30">
                  {group.heading}
                </div>
              )}
              {group.items.map((item) => {
                const isActive = pathname.endsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
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
            </div>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-white/10 space-y-2">
        {role === "buyer" && (
          <Link
            href="/dashboard/sell/new"
            onClick={onNavigate}
            className="flex items-center justify-center gap-2 h-9 rounded-xl bg-[#8136B2] text-white text-xs font-bold hover:bg-[#370B55] transition-colors"
          >
            <Tag className="h-4 w-4" />
            Sell your car
          </Link>
        )}
        {isAdmin ? (
          <button
            onClick={() => {
              onNavigate();
              lockAdmin();
            }}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-xs text-white/55 hover:bg-white/5 hover:text-white"
          >
            <Lock className="h-4 w-4" />
            Lock admin
          </button>
        ) : (
          <Link
            href="/dashboard/settings"
            onClick={onNavigate}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-white/55 hover:bg-white/5 hover:text-white"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop rail */}
      {/* h-screen + self-start (not min-h-screen/stretch) so the rail is exactly
          viewport-tall and `sticky top-0` actually has room to stick. */}
      <aside className="hidden lg:flex w-64 flex-col bg-[#0B0B10] h-screen sticky top-0 self-start overflow-y-auto text-white">
        {panel(() => {})}
      </aside>

      {/* Mobile top bar with hamburger */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 bg-[#0B0B10] text-white px-4 h-14 border-b border-white/10">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="-ms-1 p-1.5 rounded-lg hover:bg-white/10"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="h-8 w-8 rounded-lg bg-white/15 flex items-center justify-center text-white font-black text-[10px] ring-1 ring-white/25">
          DXB
        </div>
        <span className="font-bold">{brand.name}</span>
        <span className="ms-auto text-[10px] uppercase tracking-widest text-white/40">
          {isAdmin ? "ADMIN" : ROLE_LABEL[role]}
        </span>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 start-0 flex w-72 max-w-[82%] flex-col overflow-y-auto bg-[#0B0B10] text-white shadow-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute top-4 end-3 z-10 p-1.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            {panel(() => setOpen(false))}
          </aside>
        </div>
      )}
    </>
  );
}
