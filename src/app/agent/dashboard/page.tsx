import Image from "next/image";
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

const stateStyle: Record<string, string> = {
  DRAFT: "bg-yellow-50 text-yellow-700 border-yellow-200",
  APPROVED: "bg-blue-50 text-blue-700 border-blue-200",
  PAID: "bg-green-50 text-green-700 border-green-200",
};

export default async function AgentDashboard() {
  const session = await requireRole("AGENT");
  const agent = await db.agent.findUniqueOrThrow({
    where: { userId: session.user.id },
    include: {
      travellers: { orderBy: { createdAt: "desc" } },
      orderReferrals: { include: { order: true, traveller: true }, orderBy: { createdAt: "desc" } },
      statements: { orderBy: { month: "desc" }, take: 12 },
    },
  });

  const orderReferrals = agent.orderReferrals as AgentReferral[];
  const travellers = agent.travellers as AgentTraveller[];
  const statements = agent.statements as AgentStatement[];

  const orderedIds = new Set(orderReferrals.map((r) => r.travellerId));
  const notOrderedCount = travellers.filter((t) => !orderedIds.has(t.id)).length;
  const totalEarned = orderReferrals.reduce((sum, r) => sum + Number(r.commissionAmount), 0);
  const travellerOrderMap = new Map(orderReferrals.map((r) => [r.travellerId, r]));

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
          <span className="hidden sm:block text-xs font-semibold text-white/60 uppercase tracking-widest">Partner</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-xs text-white/60">
            {agent.code}{agent.companyName ? ` · ${agent.companyName}` : ""}
          </span>
          <LogoutButton />
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-[#1a1523]">
            Welcome{agent.contactName ? `, ${agent.contactName}` : ""}
          </h1>
          <p className="text-sm text-[#6b5f7a]">Here's an overview of your referrals and commissions.</p>
        </div>

        {/* KPI cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Total Referrals" value={travellers.length} icon="✈️" />
          <KpiCard label="Ordered" value={orderReferrals.length} icon="🛒" accent />
          <KpiCard label="Not Ordered" value={notOrderedCount} icon="⏳" />
          <KpiCard label="Total Commission" value={`₹${totalEarned.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`} icon="💰" accent />
        </div>

        {/* Referral list */}
        <div className="rounded-2xl bg-white border border-[#e0ccea] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f0e6f6] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#1a1523]">Your Referrals</h2>
              <p className="text-xs text-[#6b5f7a] mt-0.5">People you've referred and whether they've placed an order.</p>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="rounded-full bg-green-50 border border-green-200 text-green-700 px-2.5 py-1 font-semibold">{orderReferrals.length} ordered</span>
              <span className="rounded-full bg-[#f3eaf8] border border-[#e0ccea] text-[#6b5f7a] px-2.5 py-1 font-semibold">{notOrderedCount} pending</span>
            </div>
          </div>
          {travellers.length === 0 ? (
            <EmptyState message="No travellers added yet. Contact your Fresa admin to import your list." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#f0e6f6] bg-[#faf6fc]">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b5f7a]">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b5f7a]">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b5f7a]">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b5f7a]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f5eef8]">
                  {travellers.map((t) => {
                    const ordered = orderedIds.has(t.id);
                    return (
                      <tr key={t.id} className="hover:bg-[#faf6fc] transition">
                        <td className="px-6 py-3.5 font-medium text-[#1a1523]">{t.name || "—"}</td>
                        <td className="px-6 py-3.5 text-[#6b5f7a]">{t.email || "—"}</td>
                        <td className="px-6 py-3.5 text-[#6b5f7a]">{t.phone || "—"}</td>
                        <td className="px-6 py-3.5">
                          {ordered ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                              ✓ Ordered
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-[#f3eaf8] border border-[#e0ccea] px-2.5 py-0.5 text-xs font-semibold text-[#6b5f7a]">
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Commission transactions */}
        <div className="rounded-2xl bg-white border border-[#e0ccea] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f0e6f6]">
            <h2 className="text-sm font-semibold text-[#1a1523]">Commission Transactions</h2>
            <p className="text-xs text-[#6b5f7a] mt-0.5">5% commission on each matched referral order.</p>
          </div>
          {orderReferrals.length === 0 ? (
            <EmptyState message="No commission transactions yet. Commissions appear here once a referred customer places an order." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#f0e6f6] bg-[#faf6fc]">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b5f7a]">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b5f7a]">Order</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#6b5f7a]">Order Value</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#6b5f7a]">Commission (5%)</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b5f7a]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f5eef8]">
                  {orderReferrals.map((r) => (
                    <tr key={r.id} className="hover:bg-[#faf6fc] transition">
                      <td className="px-6 py-3.5 font-medium text-[#1a1523]">
                        {r.traveller.name || r.traveller.email || r.traveller.phone || "—"}
                      </td>
                      <td className="px-6 py-3.5 text-[#6b5f7a] font-mono text-xs">
                        #{r.order.orderNumber || r.order.shopifyOrderId}
                      </td>
                      <td className="px-6 py-3.5 text-right text-[#1a1523]">
                        ₹{Number(r.commissionBase).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-3.5 text-right font-semibold text-[#442037]">
                        ₹{Number(r.commissionAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Monthly statements */}
        {statements.length > 0 && (
          <div className="rounded-2xl bg-white border border-[#e0ccea] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#f0e6f6]">
              <h2 className="text-sm font-semibold text-[#1a1523]">Monthly Statements</h2>
              <p className="text-xs text-[#6b5f7a] mt-0.5">Your commission statements, processed by Fresa each month.</p>
            </div>
            <div className="divide-y divide-[#f5eef8]">
              {statements.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#faf6fc] transition">
                  <span className="text-sm font-medium text-[#1a1523]">
                    {new Date(s.month).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                  </span>
                  <span className="text-sm font-bold text-[#442037]">
                    ₹{Number(s.totalCommission).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${stateStyle[s.state] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
                    {s.state}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function KpiCard({ label, value, icon, accent }: { label: string; value: number | string; icon: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border shadow-sm px-6 py-5 flex items-center gap-4 ${accent ? "bg-[#442037] border-[#5a2b4a]" : "bg-white border-[#e0ccea]"}`}>
      <div className="text-2xl">{icon}</div>
      <div>
        <p className={`text-xs font-semibold uppercase tracking-wider ${accent ? "text-[#d4b8dc]" : "text-[#6b5f7a]"}`}>{label}</p>
        <p className={`text-2xl font-bold mt-0.5 ${accent ? "text-white" : "text-[#442037]"}`}>{value}</p>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="px-6 py-10 text-center text-sm text-[#6b5f7a]">{message}</div>
  );
}
