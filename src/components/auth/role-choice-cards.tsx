import { Link } from "@/i18n/routing";
import { Car, Building2 } from "lucide-react";

/**
 * The "buyer vs dealer" role choice cards. Shared between the sign-up page
 * (the primary role picker) and the sign-in page (a "new here?" entry point),
 * so the two-option choice is reachable from both auth screens.
 */
export function RoleChoiceCards({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <Link
        href="/sign-up?role=buyer"
        className="group flex items-center gap-3.5 rounded-2xl border border-[#E5E5EA] bg-white px-4 py-3.5 hover:border-[#141414]/30 hover:shadow-card transition-all"
      >
        <span className="h-10 w-10 rounded-xl bg-[#F4F4F6] flex items-center justify-center flex-shrink-0 group-hover:bg-[#141414] transition-colors">
          <Car className="h-5 w-5 text-[#8136B2] group-hover:text-white transition-colors" />
        </span>
        <span className="text-left min-w-0">
          <span className="block text-sm font-bold text-[#141414]">I&apos;m buying a car</span>
          {!compact && (
            <span className="block text-xs text-secondary mt-0.5">
              Browse listings, save searches, contact sellers
            </span>
          )}
        </span>
      </Link>
      <Link
        href="/sign-up?role=seller"
        className="group flex items-center gap-3.5 rounded-2xl border border-[#E5E5EA] bg-white px-4 py-3.5 hover:border-[#141414]/30 hover:shadow-card transition-all"
      >
        <span className="h-10 w-10 rounded-xl bg-[#F4F4F6] flex items-center justify-center flex-shrink-0 group-hover:bg-[#141414] transition-colors">
          <Building2 className="h-5 w-5 text-[#8136B2] group-hover:text-white transition-colors" />
        </span>
        <span className="text-left min-w-0">
          <span className="block text-sm font-bold text-[#141414]">I&apos;m selling as a dealer</span>
          {!compact && (
            <span className="block text-xs text-secondary mt-0.5">
              List inventory — verification required before going live
            </span>
          )}
        </span>
      </Link>
    </div>
  );
}
