/**
 * The signature flowing-gradient art used on the auth pages — silky pink /
 * blue / purple / gold radial waves over near-black. Extracted so the same
 * premium accent can be reused across the app (auth panels, dashboard rail,
 * hero cards) for a consistent brand feel.
 */
export function GradientArt({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden bg-[#0B0B10] ${className}`}>
      <div className="absolute -top-1/4 -left-1/3 h-[80%] w-[110%] rotate-[-18deg] rounded-[100%] bg-[radial-gradient(ellipse_at_center,#FF2E9A_0%,#B01E8F_35%,transparent_70%)] opacity-80 blur-2xl" />
      <div className="absolute top-1/4 -right-1/3 h-[70%] w-[110%] rotate-[15deg] rounded-[100%] bg-[radial-gradient(ellipse_at_center,#4F46E5_0%,#2563EB_40%,transparent_72%)] opacity-70 blur-2xl" />
      <div className="absolute -bottom-1/4 -left-1/4 h-[75%] w-[120%] rotate-[8deg] rounded-[100%] bg-[radial-gradient(ellipse_at_center,#7C3AED_0%,#3B0764_45%,transparent_75%)] opacity-80 blur-2xl" />
      <div className="absolute bottom-0 right-0 h-[55%] w-[80%] rotate-[-12deg] rounded-[100%] bg-[radial-gradient(ellipse_at_center,#8136B2_0%,#C2410C_40%,transparent_70%)] opacity-40 blur-3xl animate-pulse-glow" />
      <div className="absolute inset-0 bg-[repeating-linear-gradient(115deg,transparent_0px,transparent_9px,rgba(255,255,255,0.035)_10px,transparent_11px)]" />
      <div className="absolute inset-0 bg-black/35" />
    </div>
  );
}
