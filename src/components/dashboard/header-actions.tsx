"use client";

import { useEffect } from "react";
import { Link } from "@/i18n/routing";
import { useRouter } from "@/i18n/routing";
import { Bell, Search } from "lucide-react";

/**
 * Interactive header actions: the search pill routes to the inventory
 * search (also bound to Cmd/Ctrl+K), and the bell opens the leads inbox —
 * the dashboard's notification source.
 */
export function HeaderActions() {
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        router.push("/dashboard/inventory");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <>
      <button
        onClick={() => router.push("/dashboard/inventory")}
        aria-label="Search inventory"
        className="hidden md:flex items-center gap-2 h-8 w-72 rounded-full bg-[#F4F4F6] border border-[#E5E5EA] px-4 text-xs text-muted hover:border-[#141414]/20 transition-colors"
      >
        <Search className="h-4 w-4" />
        Search…
        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-white border border-[#E5E5EA]">⌘K</span>
      </button>
      <Link
        href="/dashboard/leads"
        aria-label="Notifications — open leads inbox"
        className="relative h-8 w-10 rounded-full bg-[#F4F4F6] border border-[#E5E5EA] flex items-center justify-center hover:border-[#141414]/20 transition-colors"
      >
        <Bell className="h-4 w-4" />
        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#8136B2]" />
      </Link>
    </>
  );
}
