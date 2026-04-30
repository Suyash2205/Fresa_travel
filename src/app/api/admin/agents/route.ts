import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { z } from "zod";

import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";

const createAgentSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  code: z.string().min(3),
  companyName: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    await requireRole("ADMIN");
    const payload = createAgentSchema.parse(await req.json());

    const passwordHash = await bcrypt.hash(payload.password, 10);

    const result = await db.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.create({
        data: {
          name: payload.name,
          email: payload.email.toLowerCase(),
          role: "AGENT",
          passwordHash,
        },
      });

      const agent = await tx.agent.create({
        data: {
          userId: user.id,
          code: payload.code.toUpperCase(),
          companyName: payload.companyName,
          contactName: payload.name,
        },
      });

      return { user, agent };
    });

    return NextResponse.json({
      agent: { id: result.agent.id, code: result.agent.code },
      user: { id: result.user.id, email: result.user.email },
    });
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
      const target = (error.meta?.target as string[] | undefined)?.join(", ") || "field";
      return NextResponse.json(
        { error: `Duplicate value for ${target}. Please use a different email/code.` },
        { status: 409 },
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input values." }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to create agent right now." }, { status: 500 });
  }
}
