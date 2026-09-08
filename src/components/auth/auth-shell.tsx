import { Link } from "@/i18n/routing";
import { brand } from "@/lib/brand";
import { GradientArt } from "@/components/marketing/gradient-art";

/**
 * Split-screen auth shell (Cogie-style reference):
 * dark rounded panel with flowing gradient art + serif quote on the left,
 * clean centered form column on the right. Stacks on mobile with a compact
 * art banner above the form.
 */

const SERIF = '"Playfair Display", Georgia, "Times New Roman", serif';

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
  /** Optional — onboarding steps have no "already have an account?" line. */
  footer?: React.ReactNode;
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
              <span className="text-[#8136B2]">.</span>
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

          {footer ? (
            <div className="text-center text-xs text-secondary">{footer}</div>
          ) : null}
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
      "h-11 rounded-full border border-[#E5E5EA] bg-white hover:bg-[#F4F4F6] text-sm font-medium text-[#141414] shadow-none",
    dividerLine: "bg-[#E5E5EA]",
    dividerText: "text-[11px] text-muted",
    formFieldAction: "text-xs font-semibold text-[#141414] hover:text-[#6B21A8]",
    identityPreview: "rounded-xl bg-[#F4F3F1] border-0",
    footer: "!hidden",
    footerAction: "!hidden",
  },
};
