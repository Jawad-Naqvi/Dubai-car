import { cn } from "@/lib/utils";

interface BentoCardProps {
  variant?: "dark" | "gold" | "emerald";
  className?: string;
  children: React.ReactNode;
}

export function BentoCard({
  variant = "dark",
  className,
  children,
}: BentoCardProps) {
  const variants = {
    dark: "bg-white border border-[#E5E5E5] text-[#1A1A1A] shadow-card",
    gold: "bg-bento-gold text-white border border-[#C8A93E]/40 shadow-card",
    emerald: "bg-white border border-[#E5E5E5] text-[#1A1A1A] shadow-card",
  };

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl p-5 lg:p-6 transition-all duration-300 hover:shadow-card-hover hover:border-[#D4D4D4]",
        variants[variant],
        className,
      )}
    >
      <div className="relative z-10 h-full">{children}</div>
      {variant === "dark" && (
        <div className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-[#C8A93E]/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      )}
    </div>
  );
}

export function BentoTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={cn(
        "text-lg lg:text-xl font-semibold tracking-tight leading-snug",
        className,
      )}
    >
      {children}
    </h3>
  );
}

export function BentoDesc({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("mt-2 text-xs lg:text-sm text-secondary leading-relaxed", className)}>
      {children}
    </p>
  );
}
