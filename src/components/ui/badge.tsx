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
  verified: "bg-[#1A7A4A] text-white shadow-sm",
  reserved: "bg-[#B7791F]/12 text-[#8A5A12] ring-1 ring-[#B7791F]/30",
  new: "bg-[#1B4FA0] text-white shadow-sm",
  export: "bg-[#C8A93E] text-white shadow-sm",
  inspected: "bg-[#1A7A4A]/12 text-[#1A7A4A] ring-1 ring-[#1A7A4A]/25",
  featured: "bg-[#C8A93E] text-white shadow-sm",
  neutral: "bg-[#F4F4F4] text-[#6B6B6B] ring-1 ring-[#E5E5E5]",
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
