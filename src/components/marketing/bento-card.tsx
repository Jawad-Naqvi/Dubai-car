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
    dark: "bg-bento-dark border border-white/8 text-white",
    gold: "bg-bento-gold text-[#1A1208] border border-[#D4AF37]/30",
    emerald: "bg-[#1A1A1A] border border-[#D4AF37]/25 text-white",
  };

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded p-5 lg:p-6 transition-all duration-300 hover:border-[#D4AF37]/40 grain",
        variants[variant],
        className,
      )}
    >
      <div className="relative z-10 h-full">{children}</div>
      {variant === "dark" && (
        <div className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-[#D4AF37]/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
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
