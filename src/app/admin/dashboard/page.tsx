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
    <div className="min-h-screen bg-[#faf8f5]">
      <nav className="bg-[#1a2e1e] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="https://www.fresafoods.in/cdn/shop/files/fresa-new-logo.png?v=1740643169&width=300"
            alt="Fresa Foods"
            width={100}
            height={34}
            className="brightness-0 invert"
            unoptimized
          />
          <span className="hidden sm:flex items-center gap-2 ml-1">
            <span className="h-4 w-px bg-white/20" />
            <span className="text-xs font-semibold text-white/60 uppercase tracking-widest">Admin</span>
          </span>
        </div>
        <LogoutButton />
      </nav>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-[#1a130c]">Dashboard</h1>
          <p className="text-sm text-[#7a6555]">Manage agents, travellers, orders and commission payouts.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Active Agents", value: agentsCount, icon: "👥" },
            { label: "Referred Travellers", value: travellersCount, icon: "✈️" },
            { label: "Matched Orders", value: referralsCount, icon: "🛒" },
          ].map((k) => (
            <div key={k.label} className="rounded-2xl bg-white border border-[#e5d2ba] shadow-sm px-6 py-5 flex items-center gap-4">
              <div className="text-2xl">{k.icon}</div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#7a6555]">{k.label}</p>
                <p className="text-3xl font-bold text-[#1a2e1e] mt-0.5">{k.value}</p>
              </div>
            </div>
          ))}
        </div>

        <AdminActions agents={agents} />

        {statementRows.length > 0 && (
          <div className="rounded-2xl bg-white border border-[#e5d2ba] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#f5ede0]">
              <h2 className="text-sm font-semibold text-[#1a130c]">Latest Monthly Statements</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#f5ede0] bg-[#fdf8f5]">
                    {["Agent", "Month", "Commission", "Status"].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#7a6555]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#fdf3ea]">
                  {statementRows.map((item) => (
                    <tr key={item.id} className="hover:bg-[#fdf8f5] transition">
                      <td className="px-6 py-4 font-medium text-[#1a130c]">{item.agent.code}</td>
                      <td className="px-6 py-4 text-[#7a6555]">{new Date(item.month).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</td>
                      <td className="px-6 py-4 font-bold text-[#1a2e1e]">₹{Number(item.totalCommission).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
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
