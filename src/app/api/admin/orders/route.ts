import { NextResponse } from "next/server";
import { z } from "zod";

import { requireRole } from "@/lib/auth/session";
import { matchTravellerForOrder, normalizeEmail, normalizePhone } from "@/lib/attribution/matchTraveller";
import { calculateCommission } from "@/lib/commissions/calculateCommission";
import { db } from "@/lib/db";

const schema = z.object({
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerPhone: z.string().optional(),
  orderNumber: z.string().optional(),
  subtotalAmount: z.coerce.number().positive(),
  currency: z.string().default("INR"),
}).refine(
  (d) => (d.customerEmail && d.customerEmail.length > 0) || (d.customerPhone && d.customerPhone.length > 0),
  { message: "At least one of email or phone is required." },
);

export async function POST(req: Request) {
  try {
    await requireRole("ADMIN");
    const payload = schema.parse(await req.json());

    const customerEmail = payload.customerEmail || null;
    const customerPhone = payload.customerPhone || null;
    const now = new Date();
    const manualOrderId = `manual-${Date.now()}`;

    const order = await db.order.create({
      data: {
        shopifyOrderId: manualOrderId,
        orderNumber: payload.orderNumber || manualOrderId,
        customerEmail,
        customerPhone,
        normalizedEmail: normalizeEmail(customerEmail),
        normalizedPhone: normalizePhone(customerPhone),
        subtotalAmount: payload.subtotalAmount,
        currency: payload.currency,
        financialStatus: "paid",
        createdAtShopify: now,
        updatedAtShopify: now,
      },
    });

    const match = await matchTravellerForOrder({ email: customerEmail, phone: customerPhone });

    if (!match) {
      return NextResponse.json(
        { error: "No traveller found matching this email or phone. Add the traveller first." },
        { status: 404 },
      );
    }

    const commissionAmount = calculateCommission(payload.subtotalAmount);

    await db.orderReferral.create({
      data: {
        orderId: order.id,
        travellerId: match.traveller.id,
        agentId: match.traveller.agentId,
        matchMethod: match.matchMethod,
        commissionBase: payload.subtotalAmount,
        commissionAmount,
        status: "ORDERED",
      },
    });

    return NextResponse.json({
      orderId: order.id,
      matchedAgentId: match.traveller.agentId,
      commissionAmount,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const first = error.issues[0];
      return NextResponse.json({ error: first?.message ?? "Invalid input." }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not record order." }, { status: 500 });
  }
}
