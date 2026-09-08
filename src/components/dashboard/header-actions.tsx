"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { Search } from "lucide-react";
import { NotificationBell } from "./notification-bell";

/**
 * Interactive header actions: the search pill routes to the inventory search
 * (also bound to Cmd/Ctrl+K), and the bell opens the real notification centre.
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
      {/* Real notification centre. This was a link to the leads inbox with a
          hardcoded dot that was always lit — it claimed unread items whether
          or not any existed, and gave no way to see them. */}
      <NotificationBell />
    </>
  );
}
