import { LogoutButton } from "@/components/auth/logout-button";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";

type AgentReferral = {
  id: string;
  travellerId: string;
  commissionAmount: number | { toString(): string };
  commissionBase: number | { toString(): string };
  status: string;
  order: { orderNumber: string | null; shopifyOrderId: string };
  traveller: { name: string | null; email: string | null; phone: string | null };
};

type AgentTraveller = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
};

type AgentStatement = {
  id: string;
  month: Date;
  totalCommission: number | { toString(): string };
  state: string;
};

export default async function AgentDashboard() {
  const session = await requireRole("AGENT");
  const agent = await db.agent.findUniqueOrThrow({
    where: { userId: session.user.id },
    include: {
      travellers: true,
      orderReferrals: { include: { order: true, traveller: true }, orderBy: { createdAt: "desc" } },
      statements: { orderBy: { month: "desc" }, take: 6 },
    },
  });

  const orderReferrals = agent.orderReferrals as AgentReferral[];
  const travellers = agent.travellers as AgentTraveller[];
  const statements = agent.statements as AgentStatement[];

  const orderedTravellerIds = new Set(orderReferrals.map((referral: AgentReferral) => referral.travellerId));
  const notOrderedCount = travellers.filter((traveller: AgentTraveller) => !orderedTravellerIds.has(traveller.id)).length;
  const totalEarned = orderReferrals.reduce(
    (total: number, referral: AgentReferral) => total + Number(referral.commissionAmount),
    0,
  );
  const travellerOrderMap = new Map(
    orderReferrals.map((referral: AgentReferral) => [referral.travellerId, referral] as const),
  );

  return (
    <div className="min-h-screen bg-[#fff8f5] p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
          <div>
            <h1 className="text-2xl font-semibold text-[#1d1d1d]">Agent Dashboard</h1>
            <p className="text-sm text-[#3f3f3f]">Track referrals, order conversions and commissions.</p>
          </div>
          <LogoutButton />
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <KpiCard label="Total Referrals" value={travellers.length} />
          <KpiCard label="Ordered" value={orderReferrals.length} />
          <KpiCard label="Not Ordered" value={notOrderedCount} />
          <KpiCard label="Total Commission" value={`Rs. ${totalEarned.toFixed(2)}`} />
        </section>

        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-[#1d1d1d]">Referred People List</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b">
                <tr className="text-[#444]">
                  <th className="pb-2">Traveller</th>
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Phone</th>
                  <th className="pb-2">Order Status</th>
                </tr>
              </thead>
              <tbody className="text-[#1f1f1f]">
                {travellers.map((traveller: AgentTraveller) => {
                  const referral = travellerOrderMap.get(traveller.id);
                  return (
                    <tr key={traveller.id} className="border-b last:border-0 odd:bg-white even:bg-[#fffaf7]">
                      <td className="py-3">{traveller.name || "-"}</td>
                      <td className="py-3">{traveller.email || "-"}</td>
                      <td className="py-3">{traveller.phone || "-"}</td>
                      <td className="py-3">
                        {referral ? (
                          <span className="rounded-full border border-[#a9e4c3] bg-[#e7f9ef] px-2 py-1 text-xs font-semibold text-[#155d37]">
                            Ordered
                          </span>
                        ) : (
                          <span className="rounded-full border border-[#ffd1b8] bg-[#fff2ea] px-2 py-1 text-xs font-semibold text-[#8a3f1f]">
                            Not Ordered
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {travellers.length === 0 ? (
                  <tr>
                    <td className="py-3 text-[#4f4f4f]" colSpan={4}>
                      No referred travellers found yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-[#1d1d1d]">Commission Transactions</h2>
          <p className="mb-3 text-sm text-[#3f3f3f]">
            Cart value and commission earned from each matched referral order.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b">
                <tr className="text-[#444]">
                  <th className="pb-2">Referral</th>
                  <th className="pb-2">Order</th>
                  <th className="pb-2">Cart Value</th>
                  <th className="pb-2">Commission (5%)</th>
                  <th className="pb-2">State</th>
                </tr>
              </thead>
              <tbody className="text-[#1f1f1f]">
                {orderReferrals.map((row: AgentReferral) => (
                  <tr key={row.id} className="border-b last:border-0 odd:bg-white even:bg-[#fffaf7]">
                    <td className="py-3">{row.traveller.name || row.traveller.email || row.traveller.phone}</td>
                    <td className="py-3">#{row.order.orderNumber || row.order.shopifyOrderId}</td>
                    <td className="py-3">Rs. {Number(row.commissionBase).toFixed(2)}</td>
                    <td className="py-3">Rs. {Number(row.commissionAmount).toFixed(2)}</td>
                    <td className="py-3">{row.status}</td>
                  </tr>
                ))}
                {orderReferrals.length === 0 ? (
                  <tr>
                    <td className="py-3 text-[#4f4f4f]" colSpan={5}>
                      No commission transactions yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-[#1d1d1d]">Monthly Statements</h2>
          <div className="space-y-2 text-sm">
            {statements.map((statement: AgentStatement) => (
              <div key={statement.id} className="flex items-center justify-between rounded-md border border-[#f0c7b5] bg-[#fffdfc] p-3 text-[#1f1f1f]">
                <span>{statement.month.toISOString().slice(0, 7)}</span>
                <span>Rs. {Number(statement.totalCommission).toFixed(2)}</span>
                <span>{statement.state}</span>
              </div>
            ))}
            {statements.length === 0 ? (
              <p className="text-sm text-[#4f4f4f]">No monthly statement generated yet.</p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-[#ffd8c8] bg-white p-4">
      <p className="text-sm text-[#3f3f3f]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#1d1d1d]">{value}</p>
    </div>
  );
}
