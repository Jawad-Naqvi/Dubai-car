import { cn } from "@/lib/utils";

type BadgeTone =
  | "verified"
  | "reserved"
  | "new"
  | "export"
  | "inspected"
  | "featured"
  | "neutral";

const toneStyles: Record<BadgeTone, string> = {
  verified: "bg-white/10 text-white ring-1 ring-white/30",
  reserved: "bg-[#F59E0B]/15 text-[#FCD34D] ring-1 ring-[#F59E0B]/40",
  new: "bg-gradient-to-r from-[#F0CE5C] to-[#D4AF37] text-[#1A1208] font-bold",
  export: "bg-[#D4AF37]/15 text-[#F0CE5C] ring-1 ring-[#D4AF37]/50",
  inspected: "bg-white/5 text-white ring-1 ring-white/25",
  featured: "bg-gradient-to-r from-[#D4AF37] to-[#F0CE5C] text-[#1A1208] font-bold",
  neutral: "bg-white/5 text-white ring-1 ring-white/10",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
        toneStyles[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
