import { NextResponse } from "next/server";
import { z } from "zod";
import { setUserRole } from "@/lib/data/admin";
import { isAdminAllowed, getOrSyncUser } from "@/lib/data/users";
import { recordAudit } from "@/lib/audit";

/**
 * Change a user's platform role.
 *
 * This is the single most dangerous endpoint in the product: it grants admin.
 * It previously passed `body.role` straight into setUserRole with no allowlist,
 * so any string reached a database enum write, and nothing was recorded.
 */
const bodySchema = z.object({
  role: z.enum(["buyer", "dealer", "b2b_importer", "admin"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAllowed())) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { id } = await params;
  const actor = await getOrSyncUser().catch(() => null);

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "role must be one of: buyer, dealer, b2b_importer, admin" },
      { status: 400 },
    );
  }
  const { role } = parsed.data;

  // An admin demoting themselves can lock the whole team out of the console.
  if (actor && actor.id === id && role !== "admin") {
    return NextResponse.json(
      { error: "You cannot remove your own admin access. Ask another admin." },
      { status: 400 },
    );
  }

  await setUserRole(id, role);
  await recordAudit({
    action: "user.role_changed",
    actorId: actor?.id,
    entityType: "user",
    entityId: id,
    metadata: { newRole: role },
  });

  return NextResponse.json({ ok: true });
}
