import Image from "next/image";
import { LogoutButton } from "@/components/auth/logout-button";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { AdminActions } from "@/app/admin/dashboard/admin-actions";

export default async function AdminDashboard() {
  await requireRole("ADMIN");

  const statements = await db.monthlyCommissionStatement.findMany({
    orderBy: [{ month: "desc" }, { createdAt: "desc" }],
    include: { agent: true },
    take: 10,
  });

  const [agentsCount, travellersCount, referralsCount, agents] = await Promise.all([
    db.agent.count(),
    db.traveller.count(),
    db.orderReferral.count(),
    db.agent.findMany({
      select: { id: true, code: true, contactName: true },
      orderBy: { code: "asc" },
    }),
  ]);

  const statementRows = statements as Array<{
    id: string;
    month: Date;
    totalCommission: number | { toString(): string };
    state: string;
    agent: { code: string };
  }>;

  const stateStyle: Record<string, string> = {
    DRAFT: "bg-yellow-50 text-yellow-700 border-yellow-200",
    APPROVED: "bg-blue-50 text-blue-700 border-blue-200",
    PAID: "bg-green-50 text-green-700 border-green-200",
  };

  return (
    <div className="min-h-screen bg-[#f8f3fb]">
      {/* Navbar */}
      <nav className="bg-[#442037] px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Image
            src="https://www.fresafoods.in/cdn/shop/files/fresa-new-logo.png?v=1740643169&width=300"
            alt="Fresa Foods"
            width={100}
            height={34}
            className="brightness-0 invert"
            unoptimized
          />
          <span className="hidden sm:block h-5 w-px bg-white/20" />
          <span className="hidden sm:block text-xs font-semibold text-white/60 uppercase tracking-widest">Admin</span>
        </div>
        <LogoutButton />
      </nav>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6">
        {/* Page title */}
        <div>
          <h1 className="text-xl font-bold text-[#1a1523]">Dashboard</h1>
          <p className="text-sm text-[#6b5f7a]">Manage agents, travellers, orders and commission payouts.</p>
        </div>

        {/* KPI cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard label="Active Agents" value={agentsCount} icon="👥" />
          <KpiCard label="Referred Travellers" value={travellersCount} icon="✈️" />
          <KpiCard label="Matched Orders" value={referralsCount} icon="🛒" />
        </div>

        {/* Action forms */}
        <AdminActions agents={agents} />

        {/* Statements table */}
        {statementRows.length > 0 && (
          <div className="rounded-2xl bg-white border border-[#e0ccea] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#f0e6f6]">
              <h2 className="text-sm font-semibold text-[#1a1523]">Latest Monthly Statements</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#f0e6f6] bg-[#faf6fc]">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b5f7a]">Agent</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b5f7a]">Month</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b5f7a]">Commission</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b5f7a]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f5eef8]">
                  {statementRows.map((item) => (
                    <tr key={item.id} className="hover:bg-[#faf6fc] transition">
                      <td className="px-6 py-4 font-medium text-[#1a1523]">{item.agent.code}</td>
                      <td className="px-6 py-4 text-[#6b5f7a]">
                        {new Date(item.month).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4 font-semibold text-[#442037]">
                        ₹{Number(item.totalCommission).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${stateStyle[item.state] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
                          {item.state}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function KpiCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="rounded-2xl bg-white border border-[#e0ccea] shadow-sm px-6 py-5 flex items-center gap-4">
      <div className="text-2xl">{icon}</div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#6b5f7a]">{label}</p>
        <p className="text-3xl font-bold text-[#442037] mt-0.5">{value}</p>
      </div>
    </div>
  );
}
