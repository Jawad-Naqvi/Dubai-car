"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Reusable accordion wrapper for listing-page sections that don't need to be
 * fully expanded by default (vehicle history, finance calculator). Mirrors
 * the accordion mechanics already proven in inspection-report.tsx.
 *
 * `icon` takes rendered JSX (e.g. `<FileClock className="..." />`), not a
 * component reference — some callers (VehicleHistory) are server components,
 * and a raw function reference can't cross the server/client boundary as a
 * prop, only serializable JSX can.
 */
export function CollapsibleSection({
  icon,
  title,
  badge,
  summary,
  defaultOpen = false,
  className,
  children,
}: {
  icon?: ReactNode;
  title: string;
  badge?: ReactNode;
  /** Shown inline while collapsed so the key fact stays visible without expanding. */
  summary?: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        "rounded-2xl bg-white border border-[#E7E4DA] shadow-card overflow-hidden",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 px-4 py-3.5 text-left hover:bg-[#FBFAF5] transition-colors"
      >
        {icon}
        <span className="text-sm font-bold flex-1 min-w-0 truncate">{title}</span>
        {badge}
        {summary && !open && (
          <span className="text-xs font-semibold text-secondary hidden sm:block truncate max-w-[45%]">
            {summary}
          </span>
        )}
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted transition-transform flex-shrink-0",
            open && "rotate-180",
          )}
        />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}
