import { NextResponse } from "next/server";

import { matchTravellerForOrder } from "@/lib/attribution/matchTraveller";
import { calculateCommission } from "@/lib/commissions/calculateCommission";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const token = req.headers.get("x-reconcile-token");
  if (!token || token !== process.env.RECONCILE_TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const orders = await db.order.findMany({
    where: { referral: null },
    take: 200,
    orderBy: { createdAt: "desc" },
  });

  let matchedCount = 0;
  for (const order of orders) {
    const match = await matchTravellerForOrder({
      email: order.customerEmail,
      phone: order.customerPhone,
    });
    if (!match) continue;

    await db.orderReferral.create({
      data: {
        orderId: order.id,
        travellerId: match.traveller.id,
        agentId: match.traveller.agentId,
        matchMethod: match.matchMethod,
        commissionBase: order.subtotalAmount,
        commissionAmount: calculateCommission(Number(order.subtotalAmount)),
      },
    });
    matchedCount += 1;
  }

  return NextResponse.json({ scanned: orders.length, matchedCount });
}
