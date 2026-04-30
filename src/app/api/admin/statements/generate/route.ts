import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/session";
import { generateMonthlyStatements } from "@/lib/commissions/statements";

export async function POST(req: Request) {
  await requireRole("ADMIN");
  const body = await req.json().catch(() => ({}));
  const month = body.month ? new Date(body.month) : new Date();
  await generateMonthlyStatements(month);
  return NextResponse.json({ ok: true });
}
