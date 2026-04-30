import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { parse } from "csv-parse/sync";
import * as XLSX from "xlsx";
import { z } from "zod";

import { requireRole } from "@/lib/auth/session";
import { normalizeEmail, normalizePhone } from "@/lib/attribution/matchTraveller";
import { db } from "@/lib/db";

const rowSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

function parseRows(fileName: string, fileBuffer: Buffer) {
  if (fileName.toLowerCase().endsWith(".csv")) {
    return parse(fileBuffer, { columns: true, skip_empty_lines: true }) as Record<
      string,
      string
    >[];
  }

  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const firstSheet = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheet];
  return XLSX.utils.sheet_to_json<Record<string, string>>(sheet);
}

export async function POST(req: Request) {
  const session = await requireRole(UserRole.ADMIN);
  const formData = await req.formData();
  const file = formData.get("file");
  const agentId = String(formData.get("agentId") || "");

  if (!(file instanceof File) || !agentId) {
    return NextResponse.json({ error: "file and agentId are required" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const rows = parseRows(file.name, Buffer.from(arrayBuffer));

  const batch = await db.travellerImportBatch.create({
    data: {
      createdById: session.user.id,
      fileName: file.name,
      totalRows: rows.length,
    },
  });

  let insertedRows = 0;
  let conflictedRows = 0;

  for (const row of rows) {
    const parsed = rowSchema.safeParse({
      name: row.name || row.Name || "",
      email: row.email || row.Email || undefined,
      phone: row.phone || row.Phone || undefined,
    });

    if (!parsed.success) continue;

    const normalizedEmail = normalizeEmail(parsed.data.email);
    const normalizedPhone = normalizePhone(parsed.data.phone);

    if (!normalizedEmail && !normalizedPhone) continue;

    const existing = await db.traveller.findFirst({
      where: {
        OR: [
          normalizedEmail ? { normalizedEmail } : undefined,
          normalizedPhone ? { normalizedPhone } : undefined,
        ].filter(Boolean) as object[],
      },
      orderBy: { firstSeenAt: "asc" },
    });

    if (existing) {
      conflictedRows += 1;
      continue;
    }

    await db.traveller.create({
      data: {
        batchId: batch.id,
        agentId,
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        normalizedEmail,
        normalizedPhone,
      },
    });
    insertedRows += 1;
  }

  await db.travellerImportBatch.update({
    where: { id: batch.id },
    data: { insertedRows, conflictedRows },
  });

  return NextResponse.json({ batchId: batch.id, insertedRows, conflictedRows });
}
