import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireRole } from "@/lib/auth/session";
import { generateMonthlyStatements } from "@/lib/commissions/statements";

export async function POST(req: Request) {
  await requireRole(UserRole.ADMIN);
  const body = await req.json().catch(() => ({}));
  const month = body.month ? new Date(body.month) : new Date();
  await generateMonthlyStatements(month);
  return NextResponse.json({ ok: true });
}
