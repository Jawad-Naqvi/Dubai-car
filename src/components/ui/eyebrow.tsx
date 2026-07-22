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
    gold: "bg-[#8136B2]/12 ring-[#8136B2]/30 text-[#6B21A8]",
    // legacy aliases — kept so existing callsites compile; neutral grey on light
    emerald: "bg-[#F4F4F6] ring-[#E5E5EA] text-secondary",
    white: "bg-[#F4F4F6] ring-[#E5E5EA] text-secondary",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ring-1",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
