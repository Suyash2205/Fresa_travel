import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireRole } from "@/lib/auth/session";
import { logAudit, markStatementPaid } from "@/lib/commissions/statements";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole(UserRole.ADMIN);
  const { id } = await params;
  const statement = await markStatementPaid(id);
  await logAudit({
    actorId: session.user.id,
    action: "statement.marked_paid",
    entityType: "monthly_commission_statement",
    entityId: statement.id,
  });
  return NextResponse.json({ ok: true, statement });
}
