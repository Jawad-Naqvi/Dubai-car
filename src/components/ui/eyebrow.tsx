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
    gold: "bg-[#F0941F]/12 ring-[#F0941F]/30 text-[#C97612]",
    // legacy aliases — kept so existing callsites compile; neutral grey on light
    emerald: "bg-[#F3F1E9] ring-[#E7E4DA] text-secondary",
    white: "bg-[#F3F1E9] ring-[#E7E4DA] text-secondary",
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
