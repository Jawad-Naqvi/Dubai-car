"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Lock, Phone, MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { SendMessageButton } from "./send-message-button";
import { LeadForm } from "./lead-form";

interface ContactPaywallProps {
  listingId: string;
  listingTitle: string;
  dealerPhone?: string;
  dealerWhatsapp?: string;
  className?: string;
}

/** The real tel:/WhatsApp links — shown once the contact is unlocked, either
 *  because the visitor is signed in or just completed the quick-reveal form. */
function ContactLinks({
  dealerPhone,
  dealerWhatsapp,
  whatsappMsg,
}: {
  dealerPhone?: string;
  dealerWhatsapp?: string;
  whatsappMsg: string;
}) {
  return (
    <>
      {dealerPhone && (
        <a
          href={`tel:+${dealerPhone.replace(/^\+/, "")}`}
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
    </>
  );
}

/**
 * Contact gate — anonymous quick-reveal (cars.com's "Check Availability"
 * pattern, adapted for the pay-per-lead model).
 *
 * Browsing is always free. To see the seller's phone/WhatsApp, a signed-out
 * visitor submits a one-step name + phone/email form — no account required —
 * and the number reveals immediately. That submission creates a real
 * `contact_unlock` lead (see lib/data/leads.ts: leadFeeFor / createLead),
 * which is the same billable event the pay-per-lead revenue model uses,
 * just reached with cars.com-level friction instead of a full sign-up wall.
 * Signed-in users skip straight to the contact info, as before.
 */
export function ContactPaywall({
  listingId,
  listingTitle,
  dealerPhone,
  dealerWhatsapp,
  className,
}: ContactPaywallProps) {
  const [revealed, setRevealed] = useState(false);
  const locale = useLocale();
  const whatsappMsg = `Hi, I'm interested in the ${listingTitle} (DXB-${listingId}).`;

  return (
    <div className={cn("space-y-2", className)}>
      <SignedOut>
        {revealed ? (
          <ContactLinks
            dealerPhone={dealerPhone}
            dealerWhatsapp={dealerWhatsapp}
            whatsappMsg={whatsappMsg}
          />
        ) : (
          <div className="rounded-2xl bg-[#F4F4F6] border border-[#E5E5EA] shadow-card p-3">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Lock className="h-3 w-3 text-[#8136B2]" />
              <span className="text-[10px] uppercase tracking-widest text-[#6B21A8] font-semibold">
                Reveal seller contact
              </span>
            </div>
            <LeadForm
              listingId={listingId}
              listingTitle={listingTitle}
              type="contact_unlock"
              submitLabel="Reveal contact →"
              onDone={() => setRevealed(true)}
            />
            <p className="mt-2 text-[10px] text-muted text-center leading-relaxed">
              No account needed.{" "}
              <Link
                href={`/sign-in?redirect_url=${encodeURIComponent(`/${locale}/listings/${listingId}`)}`}
                className="font-semibold text-[#141414] hover:text-[#6B21A8] underline underline-offset-2"
              >
                Sign in
              </Link>{" "}
              for one-click access next time.
            </p>
          </div>
        )}
      </SignedOut>

      <SignedIn>
        <ContactLinks
          dealerPhone={dealerPhone}
          dealerWhatsapp={dealerWhatsapp}
          whatsappMsg={whatsappMsg}
        />
        {/* Always available — creates a lead that IS delivered to the seller. */}
        <SendMessageButton listingId={listingId} listingTitle={listingTitle} />
      </SignedIn>
    </div>
  );
}
