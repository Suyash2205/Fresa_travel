import { LogoutButton } from "@/components/auth/logout-button";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { AdminActions } from "@/app/admin/dashboard/admin-actions";

export default async function AdminDashboard() {
  await requireRole("ADMIN");

  const [agentsCount, travellersCount, referralsCount, statements, agents] = await Promise.all([
    db.agent.count(),
    db.traveller.count(),
    db.orderReferral.count(),
    db.monthlyCommissionStatement.findMany({
      orderBy: [{ month: "desc" }, { createdAt: "desc" }],
      include: { agent: true },
      take: 10,
    }),
    db.agent.findMany({
      select: { id: true, code: true },
      orderBy: { code: "asc" },
    }),
  ]);

  return (
    <div className="min-h-screen bg-[#fff8f5] p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
          <div>
            <h1 className="text-2xl font-semibold text-[#1d1d1d]">Admin Dashboard</h1>
            <p className="text-sm text-[#666]">Manage agents, imports, commissions and payouts.</p>
          </div>
          <LogoutButton />
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <KpiCard label="Active Agents" value={agentsCount} />
          <KpiCard label="Referred Travellers" value={travellersCount} />
          <KpiCard label="Matched Orders" value={referralsCount} />
        </section>

        <AdminActions agents={agents} />

        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-[#1d1d1d]">Latest Monthly Statements</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b">
                <tr className="text-[#444]">
                  <th className="pb-2">Agent</th>
                  <th className="pb-2">Month</th>
                  <th className="pb-2">Commission</th>
                  <th className="pb-2">State</th>
                </tr>
              </thead>
              <tbody>
                {statements.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-3">{item.agent.code}</td>
                    <td className="py-3">{item.month.toISOString().slice(0, 7)}</td>
                    <td className="py-3">Rs. {Number(item.totalCommission).toFixed(2)}</td>
                    <td className="py-3">{item.state}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#ffd8c8] bg-white p-4">
      <p className="text-sm text-[#666]">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-[#1d1d1d]">{value}</p>
    </div>
  );
}
