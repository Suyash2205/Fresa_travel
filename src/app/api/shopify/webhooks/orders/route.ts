import crypto from "crypto";
import { NextResponse } from "next/server";

import { matchTravellerForOrder, normalizeEmail, normalizePhone } from "@/lib/attribution/matchTraveller";
import { calculateCommission } from "@/lib/commissions/calculateCommission";
import { db } from "@/lib/db";

type ShopifyOrder = {
  id: number;
  order_number: number;
  email?: string;
  phone?: string;
  subtotal_price: string;
  currency: string;
  financial_status: string;
  created_at: string;
  updated_at: string;
  customer?: { email?: string; phone?: string };
};

function verifyWebhook(body: string, hmacHeader: string | null) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret || !hmacHeader) return false;
  const digest = crypto.createHmac("sha256", secret).update(body).digest("base64");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmacHeader));
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  if (!verifyWebhook(rawBody, req.headers.get("x-shopify-hmac-sha256"))) {
    return NextResponse.json({ error: "invalid webhook signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as ShopifyOrder;
  const customerEmail = payload.email ?? payload.customer?.email ?? null;
  const customerPhone = payload.phone ?? payload.customer?.phone ?? null;
  const subtotal = Number(payload.subtotal_price);

  const order = await db.order.upsert({
    where: { shopifyOrderId: String(payload.id) },
    create: {
      shopifyOrderId: String(payload.id),
      orderNumber: String(payload.order_number),
      customerEmail,
      customerPhone,
      normalizedEmail: normalizeEmail(customerEmail),
      normalizedPhone: normalizePhone(customerPhone),
      subtotalAmount: subtotal,
      currency: payload.currency || "INR",
      financialStatus: payload.financial_status || "paid",
      createdAtShopify: new Date(payload.created_at),
      updatedAtShopify: new Date(payload.updated_at),
    },
    update: {
      customerEmail,
      customerPhone,
      normalizedEmail: normalizeEmail(customerEmail),
      normalizedPhone: normalizePhone(customerPhone),
      subtotalAmount: subtotal,
      financialStatus: payload.financial_status || "paid",
      updatedAtShopify: new Date(payload.updated_at),
    },
  });

  const match = await matchTravellerForOrder({ email: customerEmail, phone: customerPhone });
  if (!match || order.financialStatus.toLowerCase() === "voided") {
    return NextResponse.json({ ok: true, matched: false });
  }

  const commissionAmount = calculateCommission(subtotal);

  await db.orderReferral.upsert({
    where: { orderId: order.id },
    create: {
      orderId: order.id,
      travellerId: match.traveller.id,
      agentId: match.traveller.agentId,
      matchMethod: match.matchMethod,
      commissionBase: subtotal,
      commissionAmount,
      status: "ORDERED",
    },
    update: {
      travellerId: match.traveller.id,
      agentId: match.traveller.agentId,
      matchMethod: match.matchMethod,
      commissionBase: subtotal,
      commissionAmount,
      status: "ORDERED",
    },
  });

  return NextResponse.json({ ok: true, matched: true });
}
