import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Lock, Phone, MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { SendMessageButton } from "./send-message-button";

interface ContactPaywallProps {
  listingId: string;
  listingTitle: string;
  dealerPhone?: string;
  dealerWhatsapp?: string;
  className?: string;
}

/**
 * Freemium contact gate (Cars24-style).
 *
 * Browsing is free. Unlocking the seller's phone + WhatsApp requires
 * a signed-in account. Production: bills AED 25–75 per unlock (`lead_unlock`
 * payment_type) once the user clicks the unlock button.
 */
export function ContactPaywall({
  listingId,
  listingTitle,
  dealerPhone = "971500000000",
  dealerWhatsapp = "971500000000",
  className,
}: ContactPaywallProps) {
  const whatsappMsg = `Hi, I'm interested in the ${listingTitle} (DXB-${listingId}).`;

  return (
    <div className={cn("space-y-2", className)}>
      <SignedOut>
        <div className="relative rounded bg-[#121212] border border-[#D4AF37]/25 p-3 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/10 via-transparent to-[#1A1A1A]/40 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-1.5 mb-2">
              <Lock className="h-3 w-3 text-[#F0CE5C]" />
              <span className="text-[10px] uppercase tracking-widest text-[#F0CE5C] font-semibold">
                Unlock seller contact
              </span>
            </div>
            {/* Blurred preview */}
            <div className="space-y-1.5 mb-3 select-none">
              <div className="flex items-center gap-1.5">
                <Phone className="h-3 w-3 text-muted flex-shrink-0" />
                <span className="text-xs text-secondary blur-sm">+971 5• ••• ••••</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MessageCircle className="h-3 w-3 text-muted flex-shrink-0" />
                <span className="text-xs text-secondary blur-sm">WhatsApp seller</span>
              </div>
            </div>
            <Link
              href={`/sign-up?redirect_url=${encodeURIComponent(`/listings/${listingId}`)}`}
              className="flex items-center justify-center gap-1.5 h-9 rounded-sm bg-[#F0CE5C] text-[#1A1208] text-xs font-semibold hover:bg-[#FFE08A] transition-colors w-full"
            >
              Sign up free to unlock →
            </Link>
            <p className="mt-2 text-[10px] text-muted leading-relaxed">
              Free account. No credit card. Verified buyers see all seller details.
            </p>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <a
          href={`tel:+${dealerPhone}`}
          className="flex items-center justify-center gap-1.5 h-9 rounded-sm bg-[#F0CE5C] text-[#1A1208] text-xs font-semibold hover:bg-[#FFE08A] transition-colors w-full"
        >
          <Phone className="h-3 w-3" />
          Call seller
        </a>
        <a
          href={whatsappLink(dealerWhatsapp, whatsappMsg)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 h-9 rounded-sm bg-[#D4AF37] text-white text-xs font-semibold hover:bg-[#8C7220] transition-colors w-full"
        >
          <MessageCircle className="h-3 w-3" />
          WhatsApp seller
        </a>
        <SendMessageButton listingId={listingId} listingTitle={listingTitle} />
      </SignedIn>
    </div>
  );
}
