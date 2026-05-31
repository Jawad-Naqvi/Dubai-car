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
    gold: "bg-[#D4AF37]/10 ring-[#D4AF37]/30 text-[#F0CE5C]",
    // legacy aliases — kept so existing callsites compile; now neutral white-on-grey
    emerald: "bg-white/5 ring-white/20 text-white",
    white: "bg-white/5 ring-white/20 text-white",
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
