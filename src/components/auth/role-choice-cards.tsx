import { Link } from "@/i18n/routing";
import { User, Building2 } from "lucide-react";

/**
 * Account-type choice cards: Individual vs Dealer. Shared between the sign-up
 * page (the primary picker) and the sign-in page (a "new here?" entry point).
 *
 * Both types can BUY and SELL with a single account — the difference is only
 * verification: an Individual verifies with their Emirates ID; a Dealer also
 * provides a trade license and gets the dealer workspace (inventory, analytics).
 */
export function RoleChoiceCards({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <Link
        href="/sign-up?role=individual"
        className="group flex items-center gap-3.5 rounded-2xl border border-[#E5E5EA] bg-white px-4 py-3.5 hover:border-[#141414]/30 hover:shadow-card transition-all"
      >
        <span className="h-10 w-10 rounded-xl bg-[#F4F4F6] flex items-center justify-center flex-shrink-0 group-hover:bg-[#141414] transition-colors">
          <User className="h-5 w-5 text-[#8136B2] group-hover:text-white transition-colors" />
        </span>
        <span className="text-left min-w-0">
          <span className="block text-sm font-bold text-[#141414]">I&apos;m an Individual</span>
          {!compact && (
            <span className="block text-xs text-secondary mt-0.5">
              Buy and sell cars — verify once with your Emirates ID
            </span>
          )}
        </span>
      </Link>
      <Link
        href="/sign-up?role=dealer"
        className="group flex items-center gap-3.5 rounded-2xl border border-[#E5E5EA] bg-white px-4 py-3.5 hover:border-[#141414]/30 hover:shadow-card transition-all"
      >
        <span className="h-10 w-10 rounded-xl bg-[#F4F4F6] flex items-center justify-center flex-shrink-0 group-hover:bg-[#141414] transition-colors">
          <Building2 className="h-5 w-5 text-[#8136B2] group-hover:text-white transition-colors" />
        </span>
        <span className="text-left min-w-0">
          <span className="block text-sm font-bold text-[#141414]">I&apos;m a Dealer</span>
          {!compact && (
            <span className="block text-xs text-secondary mt-0.5">
              Sell inventory at scale — Emirates ID + trade license verification
            </span>
          )}
        </span>
      </Link>
    </div>
  );
}
