import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { JoinAccept } from "@/components/onboarding/join-accept";
import { peekInvitation } from "@/lib/data/invitations";
import { Link } from "@/i18n/routing";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

const TYPE_COPY: Record<string, { title: string; blurb: string }> = {
  forwarder: {
    title: "Join as a freight partner",
    blurb:
      "You've been invited to handle shipping for cars bought on the platform. Accept to set up your company account.",
  },
  platform: {
    title: "Join the admin team",
    blurb: "You've been invited as a platform administrator.",
  },
  dealer: {
    title: "Join as a seller",
    blurb: "You've been invited to sell on the platform.",
  },
  buyer: { title: "Join", blurb: "You've been invited to the platform." },
};

/**
 * The invitation-only door.
 *
 * Freight forwarders and admins never appear on the public sign-up picker;
 * they arrive here with a token an admin sent them. The privileged role is
 * carried by the invitation record — the token is a lookup key, not something
 * the visitor can edit into a different role.
 */
export default async function JoinPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  const invite = await peekInvitation(token);

  if (!invite) {
    return (
      <AuthShell
        eyebrow="Invitation"
        quoteLines={["Partner", "network."]}
        quoteSub="Invitations are single-use and time limited."
        title="This link isn't valid"
        subtitle="It may have expired, been used already, or been withdrawn."
      >
        <div className="flex items-start gap-3 rounded-xl border border-[#E5E5EA] bg-[#F4F4F6] p-4">
          <ShieldAlert className="h-4 w-4 text-[#63666A] flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-secondary leading-relaxed">
            Ask whoever invited you to send a fresh link. If you&apos;re applying
            to become a freight partner,{" "}
            <Link
              href="/partners/apply"
              className="font-semibold text-[#141414] underline underline-offset-2"
            >
              start an application
            </Link>
            .
          </p>
        </div>
      </AuthShell>
    );
  }

  const { userId } = await auth();
  // Not signed in yet: send them through the ONE sign-in page and come back.
  if (!userId) {
    redirect(`/${locale}/sign-up?redirect_url=/${locale}/join/${token}`);
  }

  const copy = TYPE_COPY[invite.orgType] ?? TYPE_COPY.buyer;

  return (
    <AuthShell
      eyebrow="Invitation"
      quoteLines={["Move cars.", "Worldwide."]}
      quoteSub="Our partners handle everything from collection to final delivery, tracked on one timeline."
      title={copy.title}
      subtitle={copy.blurb}
    >
      <JoinAccept
        token={token}
        orgType={invite.orgType}
        orgName={invite.orgName}
        locale={locale}
      />
    </AuthShell>
  );
}
