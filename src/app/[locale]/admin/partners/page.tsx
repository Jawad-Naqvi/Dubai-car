import { headers } from "next/headers";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { partnerApplications, organizations } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import { listInvitations } from "@/lib/data/invitations";
import { getOrgReviewQueue } from "@/lib/data/orgs";
import { isAdminAllowed } from "@/lib/data/users";
import { InvitationsPanel } from "@/components/admin/invitations-panel";
import { OrgReviewList } from "@/components/admin/org-review-list";
import { Users, Inbox } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * Admin console for the partner network: applications that came in, orgs
 * waiting on verification, and the onboarding links we've issued.
 */
export default async function AdminPartnersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!(await isAdminAllowed())) {
    return (
      <main className="p-6">
        <p className="text-sm text-secondary">
          You don&apos;t have access to this area.
        </p>
      </main>
    );
  }

  const [applications, invitations, pendingOrgs] = await Promise.all([
    isDbEnabled()
      ? db
          .select()
          .from(partnerApplications)
          .orderBy(desc(partnerApplications.createdAt))
          .limit(50)
      : Promise.resolve([]),
    listInvitations(50),
    getOrgReviewQueue(),
  ]);

  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") ? "http" : "https";
  const origin = `${proto}://${host}`;

  return (
    <main className="p-5 space-y-4">
      <div>
        <h1 className="text-lg font-extrabold tracking-tight text-[#141414]">
          Partner network
        </h1>
        <p className="mt-0.5 text-xs text-secondary">
          Review applications, verify organizations, and issue onboarding links.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
        <div className="space-y-4">
          <OrgReviewList orgs={pendingOrgs} />

          <div className="rounded-xl border border-[#E5E5EA] bg-white overflow-hidden">
            <div className="flex items-center gap-2 border-b border-[#E5E5EA] px-4 py-3">
              <Inbox className="h-4 w-4 text-[#8136B2]" />
              <div>
                <h3 className="text-xs font-bold text-[#141414]">
                  Applications
                </h3>
                <p className="text-[11px] text-muted">
                  From the public partner form.
                </p>
              </div>
            </div>
            {applications.length === 0 ? (
              <p className="px-4 py-6 text-center text-[11px] text-muted">
                No applications yet.
              </p>
            ) : (
              <ul className="divide-y divide-[#E5E5EA] max-h-96 overflow-y-auto">
                {applications.map((a) => (
                  <li key={a.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="text-[11px] font-semibold text-[#141414]">
                          {a.companyName}
                        </h4>
                        <p className="text-[10px] text-muted">
                          {a.contactName} · {a.email}
                          {a.phone ? ` · ${a.phone}` : ""}
                        </p>
                        {a.message && (
                          <p className="mt-1 text-[10px] text-secondary leading-relaxed line-clamp-3">
                            {a.message}
                          </p>
                        )}
                      </div>
                      <span className="rounded-full bg-[#F4F4F6] px-2 py-0.5 text-[10px] font-medium text-[#63666A] flex-shrink-0">
                        {a.countryCode}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <InvitationsPanel
          invitations={invitations.map((i) => ({
            id: i.id,
            email: i.email,
            orgType: i.orgType,
            orgName: i.orgName,
            grantsAdmin: i.grantsAdmin,
            expiresAt: i.expiresAt.toISOString(),
            acceptedAt: i.acceptedAt?.toISOString() ?? null,
            revokedAt: i.revokedAt?.toISOString() ?? null,
            createdAt: i.createdAt.toISOString(),
          }))}
          origin={origin}
          locale={locale}
        />
      </div>
    </main>
  );
}
