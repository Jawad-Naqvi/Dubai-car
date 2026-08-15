"use client";

import { useState } from "react";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { useUser, useClerk } from "@clerk/nextjs";
import { Link } from "@/i18n/routing";
import { AccountDrawer, type AccountView } from "./account-drawer";
import {
  Heart,
  Bell,
  MessageSquare,
  Tag,
  LayoutDashboard,
  Car,
  Settings,
  LogOut,
  type LucideIcon,
} from "lucide-react";

/** Buyer items open the in-place drawer (no page navigation). */
const BUYER_ITEMS: { label: string; view: AccountView; icon: LucideIcon }[] = [
  { label: "Saved cars", view: "saved", icon: Heart },
  { label: "Alerts", view: "alerts", icon: Bell },
  { label: "Messages", view: "messages", icon: MessageSquare },
  { label: "Sell your car", view: "sell", icon: Tag },
];

/** Sellers navigate to their full workspace pages. */
const SELLER_ITEMS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Inventory", href: "/dashboard/inventory", icon: Car },
  { label: "Leads", href: "/dashboard/leads", icon: MessageSquare },
];

/**
 * Custom account dropdown off the profile avatar (cars.com / Shopify style).
 * Buyers get their shopping shortcuts inline; sellers get their workspace.
 * Fully self-controlled (Radix) so the items always render — Clerk's built-in
 * UserButton menu-item API was dropping the custom links.
 */
export function AccountMenu() {
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();

  const [view, setView] = useState<AccountView | null>(null);
  const role = (user?.publicMetadata?.role as string | undefined) ?? "buyer";
  const isSeller = role === "dealer" || role === "admin" || role === "b2b_importer";

  const initial = (user?.firstName || user?.primaryEmailAddress?.emailAddress || "U")
    .charAt(0)
    .toUpperCase();

  return (
    <>
    <Dropdown.Root>
      <Dropdown.Trigger asChild>
        <button
          aria-label="Account menu"
          className="h-8 w-8 rounded-full overflow-hidden ring-1 ring-[#141414]/15 hover:ring-[#8136B2]/40 transition-shadow flex-shrink-0"
        >
          {user?.hasImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="h-full w-full flex items-center justify-center bg-gradient-to-br from-[#8136B2] to-[#370B55] text-white text-xs font-bold">
              {initial}
            </span>
          )}
        </button>
      </Dropdown.Trigger>

      <Dropdown.Portal>
        <Dropdown.Content
          align="end"
          sideOffset={8}
          className="z-[60] w-64 rounded-xl bg-white border border-[#E5E5EA] shadow-card-hover p-1.5 text-sm animate-reveal-up"
        >
          {/* Identity header */}
          <div className="px-2.5 py-2.5 flex items-center gap-2.5 border-b border-[#E5E5EA] mb-1">
            <span className="h-9 w-9 rounded-full overflow-hidden flex-shrink-0">
              {user?.hasImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="h-full w-full flex items-center justify-center bg-gradient-to-br from-[#8136B2] to-[#370B55] text-white text-xs font-bold">
                  {initial}
                </span>
              )}
            </span>
            <div className="min-w-0">
              <div className="font-semibold text-[#141414] text-xs truncate">
                {user?.fullName || user?.firstName || "Your account"}
              </div>
              <div className="text-[11px] text-muted truncate">
                {user?.primaryEmailAddress?.emailAddress}
              </div>
            </div>
          </div>

          {isSeller ? (
            SELLER_ITEMS.map((it) => (
              <Dropdown.Item key={it.href} asChild>
                <Link
                  href={it.href}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[#141414] outline-none cursor-pointer data-[highlighted]:bg-[#F3EDF9] data-[highlighted]:text-[#8136B2]"
                >
                  <it.icon className="h-4 w-4 text-muted" />
                  {it.label}
                </Link>
              </Dropdown.Item>
            ))
          ) : (
            <>
              {/* Direct link to the full buyer hub (the quick items below open
                  an in-place drawer instead of navigating). */}
              <Dropdown.Item asChild>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[#141414] outline-none cursor-pointer data-[highlighted]:bg-[#F3EDF9] data-[highlighted]:text-[#8136B2]"
                >
                  <LayoutDashboard className="h-4 w-4 text-muted" />
                  Your hub
                </Link>
              </Dropdown.Item>
              {BUYER_ITEMS.map((it) => (
                <Dropdown.Item
                  key={it.view}
                  onSelect={() => setView(it.view)}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[#141414] outline-none cursor-pointer data-[highlighted]:bg-[#F3EDF9] data-[highlighted]:text-[#8136B2]"
                >
                  <it.icon className="h-4 w-4 text-muted" />
                  {it.label}
                </Dropdown.Item>
              ))}
            </>
          )}

          <div className="my-1 h-px bg-[#E5E5EA]" />

          <Dropdown.Item
            onSelect={() => openUserProfile()}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[#141414] outline-none cursor-pointer data-[highlighted]:bg-[#F4F4F6]"
          >
            <Settings className="h-4 w-4 text-muted" />
            Manage account
          </Dropdown.Item>
          <Dropdown.Item
            onSelect={() => signOut()}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[#DC2626] outline-none cursor-pointer data-[highlighted]:bg-[#FEF2F2]"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Dropdown.Item>
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>

    {view && (
      <AccountDrawer view={view} onChangeView={setView} onClose={() => setView(null)} />
    )}
    </>
  );
}
