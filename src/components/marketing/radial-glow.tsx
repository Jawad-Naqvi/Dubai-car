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
    gold: "bg-[#C8A93E]",
    emerald: "bg-[#C8A93E]",
    white: "bg-[#E5E5E5]",
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
        "pointer-events-none absolute rounded-full opacity-[0.07] blur-3xl animate-pulse-glow",
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
        "pointer-events-none absolute inset-0 opacity-50",
        className,
      )}
      style={{
        backgroundImage:
          "radial-gradient(1px 1px at 20% 30%, rgba(200,169,62,0.18) 0, transparent 50%), radial-gradient(1px 1px at 75% 60%, rgba(0,0,0,0.05) 0, transparent 50%), radial-gradient(1.5px 1.5px at 40% 80%, rgba(200,169,62,0.14) 0, transparent 50%), radial-gradient(1px 1px at 90% 15%, rgba(0,0,0,0.05) 0, transparent 50%), radial-gradient(1px 1px at 10% 70%, rgba(200,169,62,0.12) 0, transparent 50%)",
        backgroundSize: "600px 600px",
      }}
    />
  );
}
