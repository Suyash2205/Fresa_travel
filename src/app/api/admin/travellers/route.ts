import { NextResponse } from "next/server";
import { z } from "zod";

import { requireRole } from "@/lib/auth/session";
import { normalizeEmail, normalizePhone } from "@/lib/attribution/matchTraveller";
import { db } from "@/lib/db";

const schema = z.object({
  agentId: z.string().min(1),
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
}).refine(
  (d) => (d.email && d.email.length > 0) || (d.phone && d.phone.length > 0),
  { message: "At least one of email or phone is required." },
);

export async function POST(req: Request) {
  try {
    const session = await requireRole("ADMIN");
    const payload = schema.parse(await req.json());

    const normalizedEmail = normalizeEmail(payload.email || null);
    const normalizedPhone = normalizePhone(payload.phone || null);

    const existing = await db.traveller.findFirst({
      where: {
        OR: [
          normalizedEmail ? { normalizedEmail } : undefined,
          normalizedPhone ? { normalizedPhone } : undefined,
        ].filter(Boolean) as object[],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A traveller with this email or phone already exists." },
        { status: 409 },
      );
    }

    const batch = await db.travellerImportBatch.create({
      data: {
        createdById: session.user.id,
        fileName: "manual-entry",
        totalRows: 1,
        insertedRows: 1,
        conflictedRows: 0,
      },
    });

    const traveller = await db.traveller.create({
      data: {
        batchId: batch.id,
        agentId: payload.agentId,
        name: payload.name || null,
        email: payload.email || null,
        phone: payload.phone || null,
        normalizedEmail,
        normalizedPhone,
      },
    });

    return NextResponse.json({ traveller: { id: traveller.id } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const first = error.issues[0];
      return NextResponse.json({ error: first?.message ?? "Invalid input." }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not add traveller." }, { status: 500 });
  }
}
