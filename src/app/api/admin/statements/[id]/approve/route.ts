import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/session";
import { approveStatement, logAudit } from "@/lib/commissions/statements";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("ADMIN");
  const { id } = await params;
  const statement = await approveStatement(id);
  await logAudit({
    actorId: session.user.id,
    action: "statement.approved",
    entityType: "monthly_commission_statement",
    entityId: statement.id,
  });
  return NextResponse.json({ ok: true, statement });
}
