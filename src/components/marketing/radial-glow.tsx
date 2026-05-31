import { cn } from "@/lib/utils";

export function RadialGlow({
  className,
  color = "gold",
  size = "lg",
}: {
  className?: string;
  // legacy variants kept for backward-compat; all map onto black/white/gold
  color?: "gold" | "emerald" | "white";
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const colors = {
    gold: "bg-[#D4AF37]",
    emerald: "bg-white",
    white: "bg-white",
  };
  const sizes = {
    sm: "w-48 h-48",
    md: "w-72 h-72",
    lg: "w-[28rem] h-[28rem]",
    xl: "w-[40rem] h-[40rem]",
  };
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute rounded-full opacity-15 blur-3xl animate-pulse-glow",
        colors[color],
        sizes[size],
        className,
      )}
    />
  );
}

export function StarField({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 opacity-40",
        className,
      )}
      style={{
        backgroundImage:
          "radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.4) 0, transparent 50%), radial-gradient(1px 1px at 75% 60%, rgba(212,175,55,0.4) 0, transparent 50%), radial-gradient(1.5px 1.5px at 40% 80%, rgba(255,255,255,0.3) 0, transparent 50%), radial-gradient(1px 1px at 90% 15%, rgba(212,175,55,0.4) 0, transparent 50%), radial-gradient(1px 1px at 10% 70%, rgba(255,255,255,0.3) 0, transparent 50%)",
        backgroundSize: "600px 600px",
      }}
    />
  );
}
