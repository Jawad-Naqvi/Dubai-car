import { UserButton } from "@clerk/nextjs";
import { Bell, Search } from "lucide-react";

export function DashboardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="border-b border-[#E5E5E5] bg-white sticky top-0 z-30">
      <div className="px-8 py-5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xs font-bold tracking-tight truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs text-muted truncate">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button className="hidden md:flex items-center gap-2 h-8 w-72 rounded-sm bg-[#F4F4F4] border border-[#E5E5E5] px-4 text-xs text-muted hover:border-[#C8A93E]/30">
            <Search className="h-4 w-4" />
            Search…
            <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-[#F4F4F4]">⌘K</span>
          </button>
          <button className="relative h-8 w-10 rounded-sm bg-[#F4F4F4] border border-[#E5E5E5] flex items-center justify-center hover:border-[#C8A93E]/30">
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#C8A93E]" />
          </button>
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-8 w-10 ring-1 ring-[#C8A93E]/30",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
