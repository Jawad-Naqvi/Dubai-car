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
  dealerPhone,
  dealerWhatsapp,
  className,
}: ContactPaywallProps) {
  const whatsappMsg = `Hi, I'm interested in the ${listingTitle} (DXB-${listingId}).`;

  return (
    <div className={cn("space-y-2", className)}>
      <SignedOut>
        <div className="relative rounded-2xl bg-[#F3F1E9] border border-[#E7E4DA] shadow-card p-3 overflow-hidden">
          <div className="relative">
            <div className="flex items-center gap-1.5 mb-2">
              <Lock className="h-3 w-3 text-[#F0941F]" />
              <span className="text-[10px] uppercase tracking-widest text-[#C97612] font-semibold">
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
              className="flex items-center justify-center gap-1.5 h-9 rounded-full bg-[#141414] text-white text-xs font-semibold hover:bg-[#141414]/90 transition-colors w-full"
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
        {dealerPhone && (
          <a
            href={`tel:+${dealerPhone}`}
            className="flex items-center justify-center gap-1.5 h-9 rounded-full bg-[#141414] text-white text-xs font-semibold hover:bg-[#141414]/90 transition-colors w-full"
          >
            <Phone className="h-3 w-3" />
            Call seller
          </a>
        )}
        {dealerWhatsapp && (
          <a
            href={whatsappLink(dealerWhatsapp, whatsappMsg)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 h-9 rounded-full bg-[#1A7A4A] text-white text-xs font-semibold hover:bg-[#15633C] transition-colors w-full"
          >
            <MessageCircle className="h-3 w-3" />
            WhatsApp seller
          </a>
        )}
        {/* Always available — creates a lead that IS delivered to the seller. */}
        <SendMessageButton listingId={listingId} listingTitle={listingTitle} />
      </SignedIn>
    </div>
  );
}
