import { DashboardHeader } from "@/components/dashboard/header";
import { ModerationQueue } from "@/components/admin/moderation-queue";
import { B2BVerifications } from "@/components/admin/b2b-verifications";
import { getModerationQueue } from "@/lib/data/admin";
import { getB2BBuyers } from "@/lib/data/b2b";

export default async function ModerationPage() {
  const [items, buyers] = await Promise.all([
    getModerationQueue(),
    getB2BBuyers(),
  ]);
  const pendingB2B = buyers.filter((b) => !b.isVerified).length;

  return (
    <>
      <DashboardHeader
        title="Moderation queue"
        subtitle={`${items.length} listing${items.length === 1 ? "" : "s"} · ${pendingB2B} B2B verification${pendingB2B === 1 ? "" : "s"}`}
      />
      <main className="p-5 space-y-4">
        <B2BVerifications buyers={buyers} />
        <ModerationQueue items={items} />
      </main>
    </>
  );
}
