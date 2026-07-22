import { UserButton } from "@clerk/nextjs";
import { HeaderActions } from "./header-actions";

export function DashboardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="border-b border-[#E5E5EA] bg-white sticky top-0 z-30">
      <div className="px-8 py-5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-sm font-bold tracking-tight truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs text-muted truncate">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <HeaderActions />
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-8 w-10 ring-1 ring-[#8136B2]/30",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
