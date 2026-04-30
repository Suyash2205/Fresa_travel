import { Prisma } from "@prisma/client";
import { endOfMonth, startOfMonth } from "date-fns";

import { db } from "@/lib/db";

export async function generateMonthlyStatements(month: Date) {
  const monthStart = normalizeStatementMonth(month);
  const monthEnd = endOfMonth(month);

  const grouped = await db.orderReferral.groupBy({
    by: ["agentId"],
    _sum: { commissionAmount: true },
    where: {
      createdAt: { gte: monthStart, lte: monthEnd },
      status: "ORDERED",
    },
  });

  for (const row of grouped) {
    if (!row._sum.commissionAmount) continue;
    const total = row._sum.commissionAmount;

    await db.monthlyCommissionStatement.upsert({
      where: { agentId_month: { agentId: row.agentId, month: monthStart } },
      create: {
        agentId: row.agentId,
        month: monthStart,
        totalCommission: total,
      },
      update: {
        totalCommission: total,
      },
    });

    const statement = await db.monthlyCommissionStatement.findUniqueOrThrow({
      where: { agentId_month: { agentId: row.agentId, month: monthStart } },
    });

    const referrals = await db.orderReferral.findMany({
      where: {
        agentId: row.agentId,
        createdAt: { gte: monthStart, lte: monthEnd },
        status: "ORDERED",
      },
      select: { id: true, commissionAmount: true },
    });

    for (const referral of referrals) {
      await db.statementItem.upsert({
        where: { orderReferralId: referral.id },
        create: {
          statementId: statement.id,
          orderReferralId: referral.id,
          amountSnapshot: referral.commissionAmount,
        },
        update: {
          amountSnapshot: referral.commissionAmount,
        },
      });
    }
  }
}

export function normalizeStatementMonth(month: Date) {
  return startOfMonth(month);
}

export async function approveStatement(statementId: string, notes?: string) {
  return db.monthlyCommissionStatement.update({
    where: { id: statementId },
    data: {
      state: "APPROVED",
      approvedAt: new Date(),
      notes,
    },
  });
}

export async function markStatementPaid(statementId: string) {
  return db.$transaction(async (tx: Prisma.TransactionClient) => {
    const statement = await tx.monthlyCommissionStatement.update({
      where: { id: statementId },
      data: { state: "PAID", paidAt: new Date() },
      include: { items: true },
    });

    if (statement.items.length > 0) {
      await tx.orderReferral.updateMany({
        where: {
          id: { in: statement.items.map((item: { orderReferralId: string }) => item.orderReferralId) },
        },
        data: { status: "PAID" },
      });
    }

    return statement;
  });
}

export async function logAudit(input: {
  actorId?: string;
  action: string;
  entityType: string;
  entityId: string;
  payload?: Prisma.JsonValue;
}) {
  await db.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      payloadJson: input.payload ? JSON.stringify(input.payload) : null,
    },
  });
}
