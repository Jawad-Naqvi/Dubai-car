import { cn } from "@/lib/utils";

export function Eyebrow({
  children,
  className,
  tone = "gold",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "gold" | "emerald" | "white";
}) {
  const toneClasses = {
    gold: "bg-[#C8A93E]/12 ring-[#C8A93E]/30 text-[#A98F2E]",
    // legacy aliases — kept so existing callsites compile; neutral grey on light
    emerald: "bg-[#F4F4F4] ring-[#E5E5E5] text-secondary",
    white: "bg-[#F4F4F4] ring-[#E5E5E5] text-secondary",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ring-1",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
