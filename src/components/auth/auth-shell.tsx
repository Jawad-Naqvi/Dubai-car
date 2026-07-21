import { Link } from "@/i18n/routing";
import { brand } from "@/lib/brand";

/**
 * Split-screen auth shell (Cogie-style reference):
 * dark rounded panel with flowing gradient art + serif quote on the left,
 * clean centered form column on the right. Stacks on mobile with a compact
 * art banner above the form.
 */

const SERIF = '"Playfair Display", Georgia, "Times New Roman", serif';

function GradientArt({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden bg-[#0B0B10] ${className}`}>
      {/* silky gradient waves */}
      <div className="absolute -top-1/4 -left-1/3 h-[80%] w-[110%] rotate-[-18deg] rounded-[100%] bg-[radial-gradient(ellipse_at_center,#FF2E9A_0%,#B01E8F_35%,transparent_70%)] opacity-80 blur-2xl" />
      <div className="absolute top-1/4 -right-1/3 h-[70%] w-[110%] rotate-[15deg] rounded-[100%] bg-[radial-gradient(ellipse_at_center,#4F46E5_0%,#2563EB_40%,transparent_72%)] opacity-70 blur-2xl" />
      <div className="absolute -bottom-1/4 -left-1/4 h-[75%] w-[120%] rotate-[8deg] rounded-[100%] bg-[radial-gradient(ellipse_at_center,#7C3AED_0%,#3B0764_45%,transparent_75%)] opacity-80 blur-2xl" />
      <div className="absolute bottom-0 right-0 h-[55%] w-[80%] rotate-[-12deg] rounded-[100%] bg-[radial-gradient(ellipse_at_center,#F0941F_0%,#C2410C_40%,transparent_70%)] opacity-40 blur-3xl animate-pulse-glow" />
      {/* fine sheen lines */}
      <div className="absolute inset-0 bg-[repeating-linear-gradient(115deg,transparent_0px,transparent_9px,rgba(255,255,255,0.035)_10px,transparent_11px)]" />
      <div className="absolute inset-0 bg-black/35" />
    </div>
  );
}

export function AuthShell({
  eyebrow,
  quoteLines,
  quoteSub,
  title,
  subtitle,
  footer,
  children,
}: {
  eyebrow: string;
  quoteLines: string[];
  quoteSub: string;
  title: string;
  subtitle: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0B0B10] p-2 sm:p-5 flex">
      <div className="relative flex-1 grid grid-cols-1 lg:grid-cols-2 bg-white rounded-2xl sm:rounded-[2rem] overflow-hidden shadow-card-hover">
        {/* ==== Left — gradient art panel ==== */}
        <div className="relative hidden lg:flex flex-col justify-between m-4 rounded-[1.6rem] overflow-hidden p-10 min-h-[640px]">
          <GradientArt />
          <div className="relative flex items-center gap-4 text-white/90">
            <span className="text-[11px] font-semibold uppercase tracking-[0.3em]">
              {eyebrow}
            </span>
            <span className="h-px w-16 bg-white/50" />
          </div>
          <div className="relative">
            <h2
              className="text-5xl xl:text-6xl text-white leading-[1.08]"
              style={{ fontFamily: SERIF }}
            >
              {quoteLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h2>
            <p className="mt-5 text-[13px] text-white/70 max-w-xs leading-relaxed">
              {quoteSub}
            </p>
          </div>
        </div>

        {/* ==== Right — form column ==== */}
        <div className="relative flex flex-col px-5 sm:px-12 py-6 sm:py-8 lg:py-10">
          {/* compact art banner on mobile */}
          <div className="lg:hidden relative rounded-2xl overflow-hidden h-20 sm:h-28 mb-5 sm:mb-8">
            <GradientArt />
            <div className="relative h-full flex items-center justify-between px-6">
              <span className="text-white text-[10px] font-semibold uppercase tracking-[0.3em]">
                {eyebrow}
              </span>
            </div>
          </div>

          <Link href="/" className="flex items-center justify-center gap-2">
            <span className="text-[#141414] font-extrabold text-lg tracking-tight">
              {brand.name}
              <span className="text-[#F0941F]">.</span>
            </span>
          </Link>

          <div className="flex-1 flex flex-col justify-center py-6 sm:py-10 w-full max-w-sm mx-auto">
            <h1
              className="text-3xl sm:text-4xl lg:text-[44px] text-[#141414] text-center leading-tight"
              style={{ fontFamily: SERIF }}
            >
              {title}
            </h1>
            <p className="mt-2.5 text-xs text-secondary text-center leading-relaxed">
              {subtitle}
            </p>

            <div className="mt-6 sm:mt-8">{children}</div>
          </div>

          <div className="text-center text-xs text-secondary">{footer}</div>
        </div>
      </div>
    </div>
  );
}

/** Clerk appearance shared by sign-in / sign-up, tuned to the reference. */
export const clerkAuthAppearance = {
  layout: {
    socialButtonsVariant: "blockButton" as const,
    socialButtonsPlacement: "bottom" as const,
  },
  elements: {
    rootBox: "w-full",
    card: "!shadow-none !bg-transparent !p-0 w-full !border-0 !rounded-none",
    cardBox: "!shadow-none !bg-transparent w-full !border-0 !rounded-none",
    header: "!hidden",
    headerTitle: "!hidden",
    headerSubtitle: "!hidden",
    main: "gap-5",
    form: "gap-4",
    formFieldLabel: "text-xs font-medium text-[#141414]",
    formFieldInput:
      "h-11 rounded-xl bg-[#F4F3F1] border border-transparent text-sm text-[#141414] placeholder:text-[#98958B] focus:border-[#141414]/20 focus:ring-2 focus:ring-[#141414]/10 shadow-none",
    formButtonPrimary:
      "h-11 rounded-full bg-[#141414] hover:bg-[#2E2C28] text-white text-sm font-semibold shadow-none normal-case tracking-normal after:hidden",
    socialButtonsBlockButton:
      "h-11 rounded-full border border-[#E7E4DA] bg-white hover:bg-[#F3F1E9] text-sm font-medium text-[#141414] shadow-none",
    dividerLine: "bg-[#E7E4DA]",
    dividerText: "text-[11px] text-muted",
    formFieldAction: "text-xs font-semibold text-[#141414] hover:text-[#C97612]",
    identityPreview: "rounded-xl bg-[#F4F3F1] border-0",
    footer: "!hidden",
    footerAction: "!hidden",
  },
};
